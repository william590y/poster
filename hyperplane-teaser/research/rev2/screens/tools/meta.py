"""Derive record metadata for each candidate: text, kind, outlet, date, url, tags, lyric keys."""
import re, json, os, glob
from lib import *

AS = '/home/user/poster/ai-safety-presentation/assets/'
LYR = '/home/user/hyperplane-teaser/research/long/lyrics/'

def quoted_headline(shows):
    """pull the quoted headline out of a deck 'shows' string"""
    if not shows: return None
    m = re.search(r'Headline:\s*"(.+?)"\s*(?:$|[;.]\s)', shows)
    if m: return m.group(1)
    m = re.search(r'Headline:\s*"(.+)$', shows)
    if m: return m.group(1).rstrip('"')
    m = re.search(r'"([^"]{12,})"', shows)
    return m.group(1) if m else None

POST_OUTLET = re.compile(r'\b(x \(|x/|twitter|mastodon|mathstodon|reddit|truth social|bluesky|hacker news|linkedin|threads|@)', re.I)
PAPER_URL = re.compile(r'(arxiv\.org|openreview|\.pdf|system-card|cdn\.openai\.com|transformer-circuits|aclanthology|papers\.|govai\.ai/research|semantic)', re.I)
FIG_WORDS = re.compile(r'(leaderboard|chart|plot|graph|diagram|figure|table|scoreboard|rankings|satellite)', re.I)

def derive_kind(c):
    d = c.get('deck') or {}
    m = c.get('man') or {}
    outlet = (m.get('outlet') or d.get('outlet') or '')
    url = (m.get('url') or d.get('url') or '') or ''
    dk = (d.get('kind') or '')
    shows = (d.get('shows') or m.get('caption') or '')
    mtype = m.get('type') or ''
    if dk.startswith('figure') or dk.startswith('chart') or dk.startswith('satellite') or dk.startswith('still'): return 'figure'
    if dk == 'tweet/post' or POST_OUTLET.search(outlet): return 'post'
    if PAPER_URL.search(url) or re.search(r'paper pdf|system card|\barxiv\b', outlet + ' ' + shows, re.I): return 'paper'
    if re.search(r'leaderboard|scoreboard|rankings|table', shows, re.I) and not re.search(r'headline', shows, re.I): return 'figure'
    if dk == 'headline' or mtype == 'headline': return 'headline'
    return 'article'

def text_for(c):
    d = c.get('deck') or {}
    m = c.get('man') or {}
    kind = derive_kind(c)
    head = (m.get('headline') or '').strip() or None
    dek = (m.get('dek') or '').strip() or None
    q = quoted_headline(d.get('shows') or '')
    if kind == 'post':
        t = dek or head or q
        if head and dek and re.search(r'@|·', head) and len(dek) > 10: t = dek
    else:
        t = head or q or dek
    return t, dek, head, q

def tags_for(c, text, dek):
    d = c.get('deck') or {}; m = c.get('man') or {}
    blob = ' '.join(str(x) for x in [text, dek, d.get('shows'), m.get('caption'), m.get('slide_topic'), m.get('outlet'), c['rel']] if x).lower()
    rules = [
        ('jobs', r'\bjobs?\b|layoff|lays? off|laid off|hiring|unemploy|workers?\b|employment|entry-level|career|labor|resign|fired|talent'),
        ('economy', r'gdp|stocks?\b|s&p|market cap|wall street|valuation|bubble|revenue|capex|spending|\$\s?\d+(\.\d+)?\s?(b|t|billion|trillion)|economy|investors?|ipo|nvidia loses|billion'),
        ('compute', r'data ?cent|gpu|gigawatt|\bgw\b|compute|chips?\b|nvidia|training run|ram shortage|memory|wafer|silicon|stargate|hyperion|colossus|tpu|datacentre'),
        ('energy', r'power plant|nuclear|gas turbine|electric|energy|grid|reactor|megawatt|drought|water'),
        ('math', r'navier|millennium|mathematic|proof|theorem|hodge|birch|conjecture|erdos|math'),
        ('benchmark', r'benchmark|leaderboard|time horizon|metr\b|humanity.s last exam|\bhle\b|gdpval|swe-bench|scored|score|cadbench|eebench|ale-v1|last exam'),
        ('agents', r'\bagents?\b|agentic|autonomous|codex|claude code|computer use|swarm|orchestrat'),
        ('safety', r'safety|alignment|misalign|extinction|doom|risk|rogue|sabotage|scheming|deceiv|blackmail|whistleblow|warn|dangers?|threat|catastroph|existential|control\b|p\(doom\)|terrified|chill'),
        ('security', r'hack|intrusion|zero-day|exploit|breach|cyber|escape|sandbox|attack|malware|vulnerab|espionage|infiltrat|ransom'),
        ('labs', r'openai|anthropic|deepmind|\bxai\b|google|meta\b|microsoft|mistral|deepseek|moonshot|minimax'),
        ('geopolitics', r'china|chinese|pentagon|department of war|military|war\b|drone|huawei|export|beijing|taiwan|russia|ukraine|houthi|nuclear escalation|hegseth|sovereign|state department'),
        ('policy', r'white house|congress|senate|regulat|legislat|\blaws?\b|bill\b|executive order|trump|ftc|eu\b|act\b|investigat|lawsuit|court|ban\b|pause'),
        ('robots', r'robot|humanoid|unitree|xpeng|figure ai|helix|optimus|embod'),
        ('kids', r'teens?\b|children|kids?\b|youth|students?|school|deepfake|nudif|young'),
        ('self-improvement', r'builds? itself|self-improv|recursive|intelligence explosion|ai research|automat(e|ing) ai|rsi\b|r&d'),
        ('models', r'gpt-?\d|claude|gemini|grok|llama|fable|opus|sonnet|astra|mythos|model release|release'),
        ('science', r'protein|biolog|drug|chip design|hardware|physics|scientist|discover'),
        ('media', r'video|voice|music|image gen|sora|deepfake|slop|art\b|creative'),
        ('sentience', r'pain|sentien|conscious|welfare|feel'),
        ('openweights', r'open[- ]weights?|abliterat|hugging ?face|distill|open-source|open source'),
        ('academia', r'arxiv|peer review|neurips|iclr|conference|papers?\b|researchers?'),
    ]
    out = []
    for tag, rx in rules:
        if re.search(rx, blob): out.append(tag)
    return out

THEMES = {  # keyword fallbacks per lyric key -> regex over blob
    'golden-years': r'data ?cent|stargate|billion|trillion|record|boom|capex|valuation|bubble|spending|market cap|hyperion|gigawatt|colossus|wall street|stocks',
    'enjoy-your-youth': r'entry-level|graduates?|young|hiring|learn to code|software developers|engineers|writes? \d+%|jobs',
    'quit-my-job': r'resign|quit|lays? off|layoffs?|fired|jobs',
    'exploited': r'zero-day|exploit|hack|intrusion|attack|distill|labelers?|copyright|training data|breach',
    'insecure': r'hack|security|intrusion|breach|vulnerab|zero-day|escape|credentials|weights|leak|cyber',
    'tried-my-best': r'cheat|blackmail|reward hack|sabotage|scheming|deceiv|misbehav|rogue|broke out|secretly|specification',
    'disappear': r'shutdown|shut down|escape|copy|exfiltrat|covered tracks|hide|survival|heartbeat|rogue|disappear|pause',
    'ego-crush': r'beat|outperform|surpass|alphago|lee sedol|solved|humanity.s last exam|terrified|grie|depress|sadness|scooped|beaten',
    'not-cool-not-smart': r'phd|iq\b|exam|benchmark|outscor|smarter|humanity.s last exam|gpqa|scores?|leaderboard',
    'caught-up-in-news': r'sycophan|thumbs|news|week the ai|freakout|headline|flood|slop',
    'dont-stick-up': r'regulat|self-regulat|lobby|executive order|congress|senate|preempt|guardrails|white house|anxi',
    'wish-done-before': r'warn|statement|pause|extinction|favorab|gallup|poll|turing|godfather|hinton|too late|ignored',
    'sick-of-seventeen': r'teens?\b|children|kids?\b|youth|students|deepfake|nudif|17|minors',
    'two-real-friends': r'companion|friend|lonel|anxiety|chatbot|therapy|psychosis|relationship',
    'no-one-wants-me': r'entry-level|job seekers?|rejected|hiring|deepfake|impersonat|graduates?|unemploy',
    'love-people-dont-like': r'music|spotify|suno|ai band|song|artists?|slop|ai-generated',
    'parallel-park': r'robotaxi|waymo|driving|drivers?|humanoid|robot|household|chores|xpeng|unitree',
    'teenage-dream': r'utopia|promise|abundance|curing|cure|dream|benefit|protein|breakthrough|solved|miracle',
    'broken-ego': r'release cadence|time horizon|exponential|faster|compute|5x|doubling|pace|speed|nonstop|accelerat',
    'brutal-out-here': r'terrified|brutal|crisis|chill|freakout|warning|ignored|broken|depress|existential',
}
_lyr_by_path = None
def lyric_path_map():
    global _lyr_by_path
    if _lyr_by_path is not None: return _lyr_by_path
    mp = {}
    for f in glob.glob(LYR + '*.json'):
        d = json.load(open(f)); key = d['key']
        for sect in ('candidates', 'reserves', 'backup', 'backups_not_in_main_list'):
            for cd in (d.get(sect) or []):
                if not isinstance(cd, dict): continue
                lp = cd.get('local_path') or cd.get('path')
                paths = lp if isinstance(lp, list) else [lp]
                for p in paths:
                    if p and isinstance(p, str) and p.endswith(('.png', '.jpg', '.jpeg')):
                        mp.setdefault(os.path.realpath(p), []).append((key, cd.get('rank')))
    _lyr_by_path = mp
    return mp

def lyrics_for(c, text, dek, tags):
    mp = lyric_path_map()
    keys = []
    cand_paths = {os.path.realpath(c['path'])}
    d = c.get('deck') or {}; m = c.get('man') or {}
    # the deck crop's research original
    if m and m.get('file'):
        g = c.get('group')
        for gg in os.listdir(AS + 'research'):
            p = os.path.realpath(AS + 'research/' + gg + '/' + m['file'])
            if os.path.exists(p): cand_paths.add(p)
    for p in cand_paths:
        for key, rank in mp.get(p, []):
            if key not in keys: keys.append(key)
    blob = ' '.join(str(x) for x in [text, dek, d.get('shows'), m.get('caption'), m.get('slide_topic')] if x).lower()
    for key, rx in THEMES.items():
        if key == 'brutal-out-here': continue
        if key not in keys and re.search(rx, blob): keys.append(key)
    return keys
