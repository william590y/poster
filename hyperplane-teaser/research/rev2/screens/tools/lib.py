"""Shared helpers: normalisation, fuzzy phrase->OCR word alignment, line boxes."""
import re, json, os
import numpy as np

OCR_DIR = '/home/user/hyperplane-teaser/research/rev2/screens/ocr'

_SUBS = {'’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-', '−': '-', ' ': ' ', '…': '...', '|': 'l'}
def norm_chars(s):
    s = s or ''
    for a, b in _SUBS.items(): s = s.replace(a, b)
    return s

def alnum(s):
    return re.sub(r'[^a-z0-9]+', '', norm_chars(s).lower())

def words_of(s):
    return re.findall(r"[a-z0-9]+(?:'[a-z]+)?|[$%&]", norm_chars(s).lower())

def build_stream(words):
    """words: list of [text,conf,x0,y0,x1,y1,line]. Returns (T, owner) where T is the alnum char stream and
    owner[i] is the word index of char i."""
    parts, owner = [], []
    for k, w in enumerate(words):
        a = alnum(w[0])
        if not a: continue
        parts.append(a); owner.extend([k] * len(a))
    return ''.join(parts), np.array(owner, dtype=np.int32)

def fuzzy_find(P, T):
    """Semi-global edit distance: best substring of T matching P. Returns (score 0..1, start, end_exclusive)."""
    m, n = len(P), len(T)
    if m == 0 or n == 0: return 0.0, 0, 0
    Pa = np.frombuffer(P.encode('ascii', 'ignore'), dtype=np.uint8)
    Ta = np.frombuffer(T.encode('ascii', 'ignore'), dtype=np.uint8)
    m, n = len(Pa), len(Ta)
    D = np.zeros((m + 1, n + 1), dtype=np.int32)
    D[:, 0] = np.arange(m + 1)
    ar = np.arange(n + 1, dtype=np.int32)
    for i in range(1, m + 1):
        cost = (Ta != Pa[i - 1]).astype(np.int32)
        E = np.empty(n + 1, dtype=np.int32)
        E[0] = D[i, 0]
        E[1:] = np.minimum(D[i - 1, :-1] + cost, D[i - 1, 1:] + 1)
        # horizontal moves (text char skipped inside the match): D[i,j] = min_k<=j E[k] + (j-k)
        D[i] = np.minimum.accumulate(E - ar) + ar
    j = int(np.argmin(D[m])); dist = int(D[m, j])
    end = j
    # traceback for the start
    i, jj = m, j
    while i > 0:
        if jj > 0 and D[i, jj] == D[i - 1, jj - 1] + (0 if Ta[jj - 1] == Pa[i - 1] else 1):
            i -= 1; jj -= 1
        elif D[i, jj] == D[i - 1, jj] + 1:
            i -= 1
        elif jj > 0 and D[i, jj] == D[i, jj - 1] + 1:
            jj -= 1
        else:
            i -= 1
    return 1.0 - dist / m, jj, end

def locate(phrase, words, min_score=0.8):
    """Find phrase in an OCR word list. Returns dict(score, w0, w1 (word idx range inclusive), boxes) or None."""
    P = alnum(phrase)
    T, owner = build_stream(words)
    if not P or not len(T): return None
    sc, s, e = fuzzy_find(P, T)
    if e <= s: return None
    w0, w1 = int(owner[s]), int(owner[e - 1])
    return dict(score=round(sc, 3), w0=w0, w1=w1)

def line_boxes(words, w0, w1, pad=3, W=None, H=None):
    """Union box per OCR line for words[w0..w1]; returns list of [x0,y0,x1,y1] in source px."""
    lines = {}
    order = []
    for k in range(w0, w1 + 1):
        t, conf, x0, y0, x1, y1, lid = words[k]
        if not alnum(t): continue
        if lid not in lines: lines[lid] = [x0, y0, x1, y1]; order.append(lid)
        else:
            b = lines[lid]; b[0] = min(b[0], x0); b[1] = min(b[1], y0); b[2] = max(b[2], x1); b[3] = max(b[3], y1)
    out = []
    for lid in order:
        x0, y0, x1, y1 = lines[lid]
        x0 -= pad; y0 -= pad; x1 += pad; y1 += pad
        if W: x0, x1 = max(0, x0), min(W, x1)
        if H: y0, y1 = max(0, y0), min(H, y1)
        out.append([int(x0), int(y0), int(x1), int(y1)])
    return out

def load_ocr(oid):
    p = f'{OCR_DIR}/{oid}.json'
    if not os.path.exists(p): return None
    return json.load(open(p))

def best_locate(phrase, ocr, min_score=0.0):
    """Try every OCR run; return the best match dict (with run name) or None."""
    best = None
    for name, words in ocr['runs'].items():
        r = locate(phrase, words)
        if not r: continue
        r['run'] = name
        r['nwords'] = r['w1'] - r['w0'] + 1
        # prefer higher score; break ties toward runs with higher mean confidence
        confs = [w[1] for w in words[r['w0']:r['w1'] + 1]]
        r['conf'] = round(sum(confs) / max(1, len(confs)), 1)
        key = (r['score'], r['conf'])
        if best is None or key > (best['score'], best['conf']): best = r
    if best and best['score'] >= min_score:
        words = ocr['runs'][best['run']]
        best['boxes'] = line_boxes(words, best['w0'], best['w1'], W=ocr['w'], H=ocr['h'])
        best['matched'] = ' '.join(w[0] for w in words[best['w0']:best['w1'] + 1])
        return best
    return None
