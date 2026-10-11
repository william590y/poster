import re
RULES = [
 ('math', r'navier|millennium|mathematic|\bmaths?\b|hodge|conjecture|erd[oő]s|olympiad|\bproof\b|theorem'),
 ('benchmarks', r'benchmark|leaderboard|time horizon|\bmetr\b|gdpval|last exam|\bhle\b|\bscores?\b|can barely measure|automation of remote'),
 ('models', r'\bgpt-?\d|claude|gemini|\bopus\b|fable|astra|mythos|new models?|model release|\bgrok\b|frontier ai|frontier model'),
 ('self-improvement', r'builds? itself|self-improv|intelligence explosion|automated research|\br&d\b|recursive|ai research'),
 ('agents', r'\bagents?\b|agentic'),
 ('rogue-agents', r'rogue|went rogue|misalign|sketchy|broke out|breakout|bypass|infiltrat|hacked|spiraling out of control|unauthori[sz]ed|prompt injections|slipping'),
 ('security', r'\bhack|intrusion|breach|cyber|espionage|exploit|prompt injection|vulnerab|escape|credentials|attack'),
 ('x-risk', r'could kill|kill all|extinction|wiping out humanity|end of the world|everyone dies|kill us all|superintelligence|worst idea in the history'),
 ('release-cadence', r'frenetic pace|model fatigue|arriving faster|every ~|new models? (used|from)|racing despite|counters with'),
 ('safety', r'safety|alarm|warn|dangerous|\brisk|could kill|extinction|doom|catastroph|terrif|chill|slow down|\bpause|worr|freakout|too powerful|prohibition|abuse|scheming|hoax'),
 ('whistleblowers', r'whistleblow|fired|resign|\bquit|ousts?\b|culture is broken|alarm on their way out|head of safety'),
 ('jobs', r'\bjobs?\b|layoff|lays? off|staff reductions|hiring|workers?\b|majors|writes? \d+%|new code is ai|job cuts|crunch time|resigned'),
 ('economy', r'\bgdp\b|stocks?\b|wall street|market cap|valuation|bubble|billion|trillion|\$\s?\d|\b\d+\s?(tn|bn)\b|revenue|spending|raises|s&p|housing investment|fund raise|\$1t'),
 ('compute', r'data ?-?cent|\bgpus?\b|gigawatt|\bgw\b|compute|\bram\b|ramageddon|\bchips?\b|nvidia|stargate|hyperion|memory'),
 ('energy', r'nuclear|electricity|power plant|gas-fired|reactor|three mile|clean air|drought'),
 ('robots', r'robot|humanoid|unitree|xpeng|\biron\b|helix|physical ai'),
 ('science', r'protein|biolog|\bdrug|chip design'),
 ('media', r'\bvideo|\bvoice|sora|suno|music|\bslop\b|distinguish real|unreality|interrupt you'),
 ('deepfakes', r'deepfake|nudif|undressing|nudes'),
 ('kids', r'\bteens?\b|children|\bkids?\b|\bschools?\b|students?|minors|youth'),
 ('policy', r'trump|white house|executive order|congress|senate|state ai laws|regulat|hegseth|pentagon|supply chain risk|whistleblower'),
 ('geopolitics', r'china|chinese|military|\bwar\b|\bwars\b|drones?|war games|ukraine|houthis?|maduro|us-china|\bxi\b|distill|missile|intelligence report|hamas'),
 ('academia', r'arxiv|peer review|neurips|\biclr\b|papers?\b|conference'),
 ('sentience', r'\bpain\b|sentien|conscious|welfare'),
 ('openai', r'openai|\bastra\b|\bgpt'),
 ('anthropic', r'anthropic|claude|mythos|fable|\bopus\b|amodei'),
 ('google', r'google|deepmind|gemini'),
 ('meta', r'\bmeta\b'),
 ('microsoft', r'microsoft'),
 ('nvidia', r'nvidia|huang'),
 ('xai', r'\bxai\b|\bgrok\b|musk'),
 ('deepseek', r'deepseek'),
]
def tags_for_text(text, extra=''):
    t = (text or '').lower()
    out = []
    for tag, rx in RULES:
        if re.search(rx, t): out.append(tag)
    return out
