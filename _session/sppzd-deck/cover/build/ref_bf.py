#!/usr/bin/env python3
"""Reference interpreter for the paper's Brainf*ck-like machine U (App. E, Table 4).

Semantics implemented (App. E, p.29-30; Sec. 2.3, p.7):
- a program is an optional leading 'S' prefix byte (not executed), then tokens until the end token 'F'
- 8 instructions < > + - [ ] . ,  and 10 macros (Table 4) that expand into pure Brainf*ck
  (C = [->+>+<<]; the printed table has the typo '[->+>+«]')
- cells mod 256, circular tape of M cells (M is not reported; 256 here)
- ',' reads the next byte of the random tape omega; '.' emits the current cell
- unmatched brackets are no-ops, so every string runs
- output = first T emitted bytes, zero-padded; halts at end of program, T bytes, or the step budget
"""
import json, random, sys

MAC = {'Z': '[-]', 'R': '[->+<]', 'L': '[->+++<]', 'N': '[-<->]', 'C': '[->+>+<<]',
       'G': '[>]', 'H': '[<]', 'W': '[[-]>+<]', 'V': '[.>]', 'X': '[-]' + '+' * 16}
ALPHA = '<>+-[].,' + 'ZRLNCGHWVX' + 'F'   # 19 generator logits


def run(prog, omega, T, M=256, budget=300000):
    if prog.startswith('S'):
        prog = prog[1:]
    code = ''
    for ch in prog:
        if ch == 'F':
            break
        code += MAC.get(ch, ch)
    match, st = {}, []
    for i, c in enumerate(code):
        if c == '[':
            st.append(i)
        elif c == ']' and st:
            j = st.pop(); match[i] = j; match[j] = i
    tape = [0] * M
    p = pc = steps = inp = 0
    out = []
    while pc < len(code) and len(out) < T and steps < budget:
        c = code[pc]; steps += 1
        if c == '+': tape[p] = (tape[p] + 1) % 256
        elif c == '-': tape[p] = (tape[p] - 1) % 256
        elif c == '>': p = (p + 1) % M
        elif c == '<': p = (p - 1) % M
        elif c == '.': out.append(tape[p])
        elif c == ',':
            tape[p] = omega[inp % len(omega)]; inp += 1
        elif c == '[':
            if pc in match and tape[p] == 0: pc = match[pc]
        elif c == ']':
            if pc in match and tape[p] != 0: pc = match[pc]
        pc += 1
    return out + [0] * (T - len(out))


def main():
    # paper examples
    rows = []
    def check(name, prog, omega, expect):
        got = run(prog, omega, len(expect) + 6)
        ok = got[:len(expect)] == expect
        rows.append((name, prog, got[:len(expect) + 6], ok))
        return ok
    rnd = random.Random(7)
    om = [rnd.randrange(256) for _ in range(64)]
    allok = True
    allok &= check('App. E for-loop', '+++[>+.<-]F', om, [1, 2, 3, 0, 0, 0])
    allok &= check('Arithmetic', 'S+[.++]', om, [1, 3, 5, 7, 9])
    allok &= check('Fibonacci (omega_0 = 1)', 'S,[[.C>.C>]', [1] + om, [1, 1, 2, 3, 5])
    allok &= check('Geometric', 'S+[.L>]', om, [1, 3, 9, 27, 81])
    allok &= check('Quadratic (omega_0 = 9)', 'S,.[<C>>VX<RX++]', [9] + om, [9, 25, 59, 111])
    allok &= check('Cubic', 'S+[[-.L>L>-]-]', om, [0, 254, 236, 74])
    for r in rows:
        print(('OK  ' if r[3] else 'FAIL') + f'  {r[0]:26s} {r[1]:22s} -> {r[2]}')
    # random programs from the uniform prior over the 19 logits, for the JS cross-check
    if len(sys.argv) > 1:
        rnd = random.Random(12345)
        cases = []
        for _ in range(int(sys.argv[2]) if len(sys.argv) > 2 else 3000):
            prog = ''
            while len(prog) < 60:
                c = rnd.choice(ALPHA)
                prog += c
                if c == 'F': break
            omega = [rnd.randrange(256) for _ in range(rnd.randrange(1, 40))]
            cases.append({'p': prog, 'w': omega, 'o': run(prog, omega, 96)})
        for prog, extra in [('S+[.++]', []), ('S,[[.C>.C>]', [1]), ('S+[.L>]', []), ('S,.[<C>>VX<RX++]', [9]), ('S+[[-.L>L>-]-]', []), ('+++[>+.<-]F', [])]:
            omega = extra + [5, 200, 17]
            cases.append({'p': prog, 'w': omega, 'o': run(prog, omega, 96)})
        json.dump(cases, open(sys.argv[1], 'w'))
        print('wrote', len(cases), 'cases')
    sys.exit(0 if allok else 1)


if __name__ == '__main__':
    main()
