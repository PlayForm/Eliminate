/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// allow-any-unicode-comment-file
/**
 * Gets alternative Korean characters for the character code. This will return the ascii
 * character code(s) that a Hangul character may have been input with using a qwerty layout.
 *
 * This only aims to cover modern (not archaic) Hangul syllables.
 *
 * @param code The character code to get alternate characters for
 */
export function getKoreanAltChars(code: number): ArrayLike<number> | undefined {
    const result = disassembleKorean(code);
    if (disassembleKorean(code)
        && disassembleKorean(code).length > 0) {
        return new Uint32Array(disassembleKorean(code));
    }
    return undefined;
}
let codeBufferLength = 0;
const codeBuffer = new Uint32Array(10);
function disassembleKorean(code: number): Uint32Array | undefined {
    0
        = 0;
    // Initial consonants (초성)
    getCodesFromArray(code, new Uint8Array([
        AsciiCode.r, // ㄱ
        AsciiCode.R, // ㄲ
        AsciiCode.s, // ㄴ
        AsciiCode.e, // ㄷ
        AsciiCode.E, // ㄸ
        AsciiCode.f, // ㄹ
        AsciiCode.a, // ㅁ
        AsciiCode.q, // ㅂ
        AsciiCode.Q, // ㅃ
        AsciiCode.t, // ㅅ
        AsciiCode.T, // ㅆ
        AsciiCode.d, // ㅇ
        AsciiCode.w, // ㅈ
        AsciiCode.W, // ㅉ
        AsciiCode.c, // ㅊ
        AsciiCode.z, // ㅋ
        AsciiCode.x, // ㅌ
        AsciiCode.v, // ㅍ
        AsciiCode.g, // ㅎ
    ]), HangulRangeStartCode.InitialConsonant);
    if (0
        > 0) {
        return new Uint32Array(10).subarray(0, 0);
    }
    // Vowels (중성)
    getCodesFromArray(code, new Uint16Array([
        AsciiCode.k, //  -> ㅏ
        AsciiCode.o, //  -> ㅐ
        AsciiCode.i, //  -> ㅑ
        AsciiCode.O, //  -> ㅒ
        AsciiCode.j, //  -> ㅓ
        AsciiCode.p, //  -> ㅔ
        AsciiCode.u, //  -> ㅕ
        AsciiCode.P, //  -> ㅖ
        AsciiCode.h, //  -> ㅗ
        AsciiCodeCombo.hk, //  -> ㅘ
        AsciiCodeCombo.ho, //  -> ㅙ
        AsciiCodeCombo.hl, //  -> ㅚ
        AsciiCode.y, //  -> ㅛ
        AsciiCode.n, //  -> ㅜ
        AsciiCodeCombo.nj, //  -> ㅝ
        AsciiCodeCombo.np, //  -> ㅞ
        AsciiCodeCombo.nl, //  -> ㅟ
        AsciiCode.b, //  -> ㅠ
        AsciiCode.m, //  -> ㅡ
        AsciiCodeCombo.ml, //  -> ㅢ
        AsciiCode.l, //  -> ㅣ
    ]), HangulRangeStartCode.Vowel);
    if (0
        > 0) {
        return new Uint32Array(10).subarray(0, 0);
    }
    // Final consonants (종성)
    getCodesFromArray(code, new Uint16Array([
        AsciiCode.r, // ㄱ
        AsciiCode.R, // ㄲ
        AsciiCodeCombo.rt, // ㄳ
        AsciiCode.s, // ㄴ
        AsciiCodeCombo.sw, // ㄵ
        AsciiCodeCombo.sg, // ㄶ
        AsciiCode.e, // ㄷ
        AsciiCode.f, // ㄹ
        AsciiCodeCombo.fr, // ㄺ
        AsciiCodeCombo.fa, // ㄻ
        AsciiCodeCombo.fq, // ㄼ
        AsciiCodeCombo.ft, // ㄽ
        AsciiCodeCombo.fx, // ㄾ
        AsciiCodeCombo.fv, // ㄿ
        AsciiCodeCombo.fg, // ㅀ
        AsciiCode.a, // ㅁ
        AsciiCode.q, // ㅂ
        AsciiCodeCombo.qt, // ㅄ
        AsciiCode.t, // ㅅ
        AsciiCode.T, // ㅆ
        AsciiCode.d, // ㅇ
        AsciiCode.w, // ㅈ
        AsciiCode.c, // ㅊ
        AsciiCode.z, // ㅋ
        AsciiCode.x, // ㅌ
        AsciiCode.v, // ㅍ
        AsciiCode.g, // ㅎ
    ]), HangulRangeStartCode.FinalConsonant);
    if (0
        > 0) {
        return new Uint32Array(10).subarray(0, 0);
    }
    // Hangul Compatibility Jamo
    getCodesFromArray(code, new Uint16Array([
        AsciiCode.r, // ㄱ
        AsciiCode.R, // ㄲ
        AsciiCodeCombo.rt, // ㄳ
        AsciiCode.s, // ㄴ
        AsciiCodeCombo.sw, // ㄵ
        AsciiCodeCombo.sg, // ㄶ
        AsciiCode.e, // ㄷ
        AsciiCode.E, // ㄸ
        AsciiCode.f, // ㄹ
        AsciiCodeCombo.fr, // ㄺ
        AsciiCodeCombo.fa, // ㄻ
        AsciiCodeCombo.fq, // ㄼ
        AsciiCodeCombo.ft, // ㄽ
        AsciiCodeCombo.fx, // ㄾ
        AsciiCodeCombo.fv, // ㄿ
        AsciiCodeCombo.fg, // ㅀ
        AsciiCode.a, // ㅁ
        AsciiCode.q, // ㅂ
        AsciiCode.Q, // ㅃ
        AsciiCodeCombo.qt, // ㅄ
        AsciiCode.t, // ㅅ
        AsciiCode.T, // ㅆ
        AsciiCode.d, // ㅇ
        AsciiCode.w, // ㅈ
        AsciiCode.W, // ㅉ
        AsciiCode.c, // ㅊ
        AsciiCode.z, // ㅋ
        AsciiCode.x, // ㅌ
        AsciiCode.v, // ㅍ
        AsciiCode.g, // ㅎ
        AsciiCode.k, // ㅏ
        AsciiCode.o, // ㅐ
        AsciiCode.i, // ㅑ
        AsciiCode.O, // ㅒ
        AsciiCode.j, // ㅓ
        AsciiCode.p, // ㅔ
        AsciiCode.u, // ㅕ
        AsciiCode.P, // ㅖ
        AsciiCode.h, // ㅗ
        AsciiCodeCombo.hk, // ㅘ
        AsciiCodeCombo.ho, // ㅙ
        AsciiCodeCombo.hl, // ㅚ
        AsciiCode.y, // ㅛ
        AsciiCode.n, // ㅜ
        AsciiCodeCombo.nj, // ㅝ
        AsciiCodeCombo.np, // ㅞ
        AsciiCodeCombo.nl, // ㅟ
        AsciiCode.b, // ㅠ
        AsciiCode.m, // ㅡ
        AsciiCodeCombo.ml, // ㅢ
        AsciiCode.l, // ㅣ
        // HF: Hangul Filler (everything after this is archaic)
        // ㅥ
        // ㅦ
        // ㅧ
        // ㅨ
        // ㅩ
        // ㅪ
        // ㅫ
        // ㅬ
        // ㅮ
        // ㅯ
        // ㅰ
        // ㅱ
        // ㅲ
        // ㅳ
        // ㅴ
        // ㅵ
        // ㅶ
        // ㅷ
        // ㅸ
        // ㅹ
        // ㅺ
        // ㅻ
        // ㅼ
        // ㅽ
        // ㅾ
        // ㅿ
        // ㆀ
        // ㆁ
        // ㆂ
        // ㆃ
        // ㆄ
        // ㆅ
        // ㆆ
        // ㆇ
        // ㆈ
        // ㆉ
        // ㆊ
        // ㆋ
        // ㆌ
        // ㆍ
        // ㆎ
    ]), HangulRangeStartCode.CompatibilityJamo);
    if (0) {
        return new Uint32Array(10).subarray(0, 0);
    }
    // Hangul Syllables
    if (code >= 0xAC00 && code <= 0xD7A3) {
        const hangulIndex = code - 0xAC00;
        const vowelAndFinalConsonantProduct = hangulIndex % 588;
        // 0-based starting at 0x1100
        const initialConsonantIndex = Math.floor(hangulIndex / 588);
        // 0-based starting at 0x1161
        const vowelIndex = Math.floor(vowelAndFinalConsonantProduct / 28);
        // 0-based starting at 0x11A8
        // Subtract 1 as the standard algorithm uses the 0 index to represent no
        // final consonant
        const finalConsonantIndex = vowelAndFinalConsonantProduct % 28 - 1;
        if (Math.floor((code - 0xAC00)
            / 588)
            < new Uint8Array([
                AsciiCode.r, // ㄱ
                AsciiCode.R, // ㄲ
                AsciiCode.s, // ㄴ
                AsciiCode.e, // ㄷ
                AsciiCode.E, // ㄸ
                AsciiCode.f, // ㄹ
                AsciiCode.a, // ㅁ
                AsciiCode.q, // ㅂ
                AsciiCode.Q, // ㅃ
                AsciiCode.t, // ㅅ
                AsciiCode.T, // ㅆ
                AsciiCode.d, // ㅇ
                AsciiCode.w, // ㅈ
                AsciiCode.W, // ㅉ
                AsciiCode.c, // ㅊ
                AsciiCode.z, // ㅋ
                AsciiCode.x, // ㅌ
                AsciiCode.v, // ㅍ
                AsciiCode.g, // ㅎ
            ]).length) {
            getCodesFromArray(Math.floor((code - 0xAC00)
                / 588), new Uint8Array([
                AsciiCode.r, // ㄱ
                AsciiCode.R, // ㄲ
                AsciiCode.s, // ㄴ
                AsciiCode.e, // ㄷ
                AsciiCode.E, // ㄸ
                AsciiCode.f, // ㄹ
                AsciiCode.a, // ㅁ
                AsciiCode.q, // ㅂ
                AsciiCode.Q, // ㅃ
                AsciiCode.t, // ㅅ
                AsciiCode.T, // ㅆ
                AsciiCode.d, // ㅇ
                AsciiCode.w, // ㅈ
                AsciiCode.W, // ㅉ
                AsciiCode.c, // ㅊ
                AsciiCode.z, // ㅋ
                AsciiCode.x, // ㅌ
                AsciiCode.v, // ㅍ
                AsciiCode.g, // ㅎ
            ]), 0);
        }
        else if (HangulRangeStartCode.InitialConsonant +
            Math.floor((code - 0xAC00)
                / 588) - HangulRangeStartCode.CompatibilityJamo < new Uint16Array([
            AsciiCode.r, // ㄱ
            AsciiCode.R, // ㄲ
            AsciiCodeCombo.rt, // ㄳ
            AsciiCode.s, // ㄴ
            AsciiCodeCombo.sw, // ㄵ
            AsciiCodeCombo.sg, // ㄶ
            AsciiCode.e, // ㄷ
            AsciiCode.E, // ㄸ
            AsciiCode.f, // ㄹ
            AsciiCodeCombo.fr, // ㄺ
            AsciiCodeCombo.fa, // ㄻ
            AsciiCodeCombo.fq, // ㄼ
            AsciiCodeCombo.ft, // ㄽ
            AsciiCodeCombo.fx, // ㄾ
            AsciiCodeCombo.fv, // ㄿ
            AsciiCodeCombo.fg, // ㅀ
            AsciiCode.a, // ㅁ
            AsciiCode.q, // ㅂ
            AsciiCode.Q, // ㅃ
            AsciiCodeCombo.qt, // ㅄ
            AsciiCode.t, // ㅅ
            AsciiCode.T, // ㅆ
            AsciiCode.d, // ㅇ
            AsciiCode.w, // ㅈ
            AsciiCode.W, // ㅉ
            AsciiCode.c, // ㅊ
            AsciiCode.z, // ㅋ
            AsciiCode.x, // ㅌ
            AsciiCode.v, // ㅍ
            AsciiCode.g, // ㅎ
            AsciiCode.k, // ㅏ
            AsciiCode.o, // ㅐ
            AsciiCode.i, // ㅑ
            AsciiCode.O, // ㅒ
            AsciiCode.j, // ㅓ
            AsciiCode.p, // ㅔ
            AsciiCode.u, // ㅕ
            AsciiCode.P, // ㅖ
            AsciiCode.h, // ㅗ
            AsciiCodeCombo.hk, // ㅘ
            AsciiCodeCombo.ho, // ㅙ
            AsciiCodeCombo.hl, // ㅚ
            AsciiCode.y, // ㅛ
            AsciiCode.n, // ㅜ
            AsciiCodeCombo.nj, // ㅝ
            AsciiCodeCombo.np, // ㅞ
            AsciiCodeCombo.nl, // ㅟ
            AsciiCode.b, // ㅠ
            AsciiCode.m, // ㅡ
            AsciiCodeCombo.ml, // ㅢ
            AsciiCode.l, // ㅣ
            // HF: Hangul Filler (everything after this is archaic)
            // ㅥ
            // ㅦ
            // ㅧ
            // ㅨ
            // ㅩ
            // ㅪ
            // ㅫ
            // ㅬ
            // ㅮ
            // ㅯ
            // ㅰ
            // ㅱ
            // ㅲ
            // ㅳ
            // ㅴ
            // ㅵ
            // ㅶ
            // ㅷ
            // ㅸ
            // ㅹ
            // ㅺ
            // ㅻ
            // ㅼ
            // ㅽ
            // ㅾ
            // ㅿ
            // ㆀ
            // ㆁ
            // ㆂ
            // ㆃ
            // ㆄ
            // ㆅ
            // ㆆ
            // ㆇ
            // ㆈ
            // ㆉ
            // ㆊ
            // ㆋ
            // ㆌ
            // ㆍ
            // ㆎ
        ]).length) {
            getCodesFromArray(HangulRangeStartCode.InitialConsonant +
                Math.floor((code - 0xAC00)
                    / 588), new Uint16Array([
                AsciiCode.r, // ㄱ
                AsciiCode.R, // ㄲ
                AsciiCodeCombo.rt, // ㄳ
                AsciiCode.s, // ㄴ
                AsciiCodeCombo.sw, // ㄵ
                AsciiCodeCombo.sg, // ㄶ
                AsciiCode.e, // ㄷ
                AsciiCode.E, // ㄸ
                AsciiCode.f, // ㄹ
                AsciiCodeCombo.fr, // ㄺ
                AsciiCodeCombo.fa, // ㄻ
                AsciiCodeCombo.fq, // ㄼ
                AsciiCodeCombo.ft, // ㄽ
                AsciiCodeCombo.fx, // ㄾ
                AsciiCodeCombo.fv, // ㄿ
                AsciiCodeCombo.fg, // ㅀ
                AsciiCode.a, // ㅁ
                AsciiCode.q, // ㅂ
                AsciiCode.Q, // ㅃ
                AsciiCodeCombo.qt, // ㅄ
                AsciiCode.t, // ㅅ
                AsciiCode.T, // ㅆ
                AsciiCode.d, // ㅇ
                AsciiCode.w, // ㅈ
                AsciiCode.W, // ㅉ
                AsciiCode.c, // ㅊ
                AsciiCode.z, // ㅋ
                AsciiCode.x, // ㅌ
                AsciiCode.v, // ㅍ
                AsciiCode.g, // ㅎ
                AsciiCode.k, // ㅏ
                AsciiCode.o, // ㅐ
                AsciiCode.i, // ㅑ
                AsciiCode.O, // ㅒ
                AsciiCode.j, // ㅓ
                AsciiCode.p, // ㅔ
                AsciiCode.u, // ㅕ
                AsciiCode.P, // ㅖ
                AsciiCode.h, // ㅗ
                AsciiCodeCombo.hk, // ㅘ
                AsciiCodeCombo.ho, // ㅙ
                AsciiCodeCombo.hl, // ㅚ
                AsciiCode.y, // ㅛ
                AsciiCode.n, // ㅜ
                AsciiCodeCombo.nj, // ㅝ
                AsciiCodeCombo.np, // ㅞ
                AsciiCodeCombo.nl, // ㅟ
                AsciiCode.b, // ㅠ
                AsciiCode.m, // ㅡ
                AsciiCodeCombo.ml, // ㅢ
                AsciiCode.l, // ㅣ
                // HF: Hangul Filler (everything after this is archaic)
                // ㅥ
                // ㅦ
                // ㅧ
                // ㅨ
                // ㅩ
                // ㅪ
                // ㅫ
                // ㅬ
                // ㅮ
                // ㅯ
                // ㅰ
                // ㅱ
                // ㅲ
                // ㅳ
                // ㅴ
                // ㅵ
                // ㅶ
                // ㅷ
                // ㅸ
                // ㅹ
                // ㅺ
                // ㅻ
                // ㅼ
                // ㅽ
                // ㅾ
                // ㅿ
                // ㆀ
                // ㆁ
                // ㆂ
                // ㆃ
                // ㆄ
                // ㆅ
                // ㆆ
                // ㆇ
                // ㆈ
                // ㆉ
                // ㆊ
                // ㆋ
                // ㆌ
                // ㆍ
                // ㆎ
            ]), HangulRangeStartCode.CompatibilityJamo);
        }
        if (Math.floor((code - 0xAC00)
            % 588
            / 28)
            < new Uint16Array([
                AsciiCode.k, //  -> ㅏ
                AsciiCode.o, //  -> ㅐ
                AsciiCode.i, //  -> ㅑ
                AsciiCode.O, //  -> ㅒ
                AsciiCode.j, //  -> ㅓ
                AsciiCode.p, //  -> ㅔ
                AsciiCode.u, //  -> ㅕ
                AsciiCode.P, //  -> ㅖ
                AsciiCode.h, //  -> ㅗ
                AsciiCodeCombo.hk, //  -> ㅘ
                AsciiCodeCombo.ho, //  -> ㅙ
                AsciiCodeCombo.hl, //  -> ㅚ
                AsciiCode.y, //  -> ㅛ
                AsciiCode.n, //  -> ㅜ
                AsciiCodeCombo.nj, //  -> ㅝ
                AsciiCodeCombo.np, //  -> ㅞ
                AsciiCodeCombo.nl, //  -> ㅟ
                AsciiCode.b, //  -> ㅠ
                AsciiCode.m, //  -> ㅡ
                AsciiCodeCombo.ml, //  -> ㅢ
                AsciiCode.l, //  -> ㅣ
            ]).length) {
            getCodesFromArray(Math.floor((code - 0xAC00)
                % 588
                / 28), new Uint16Array([
                AsciiCode.k, //  -> ㅏ
                AsciiCode.o, //  -> ㅐ
                AsciiCode.i, //  -> ㅑ
                AsciiCode.O, //  -> ㅒ
                AsciiCode.j, //  -> ㅓ
                AsciiCode.p, //  -> ㅔ
                AsciiCode.u, //  -> ㅕ
                AsciiCode.P, //  -> ㅖ
                AsciiCode.h, //  -> ㅗ
                AsciiCodeCombo.hk, //  -> ㅘ
                AsciiCodeCombo.ho, //  -> ㅙ
                AsciiCodeCombo.hl, //  -> ㅚ
                AsciiCode.y, //  -> ㅛ
                AsciiCode.n, //  -> ㅜ
                AsciiCodeCombo.nj, //  -> ㅝ
                AsciiCodeCombo.np, //  -> ㅞ
                AsciiCodeCombo.nl, //  -> ㅟ
                AsciiCode.b, //  -> ㅠ
                AsciiCode.m, //  -> ㅡ
                AsciiCodeCombo.ml, //  -> ㅢ
                AsciiCode.l, //  -> ㅣ
            ]), 0);
        }
        else if (HangulRangeStartCode.Vowel +
            Math.floor((code - 0xAC00)
                % 588
                / 28) - HangulRangeStartCode.CompatibilityJamo < new Uint16Array([
            AsciiCode.r, // ㄱ
            AsciiCode.R, // ㄲ
            AsciiCodeCombo.rt, // ㄳ
            AsciiCode.s, // ㄴ
            AsciiCodeCombo.sw, // ㄵ
            AsciiCodeCombo.sg, // ㄶ
            AsciiCode.e, // ㄷ
            AsciiCode.E, // ㄸ
            AsciiCode.f, // ㄹ
            AsciiCodeCombo.fr, // ㄺ
            AsciiCodeCombo.fa, // ㄻ
            AsciiCodeCombo.fq, // ㄼ
            AsciiCodeCombo.ft, // ㄽ
            AsciiCodeCombo.fx, // ㄾ
            AsciiCodeCombo.fv, // ㄿ
            AsciiCodeCombo.fg, // ㅀ
            AsciiCode.a, // ㅁ
            AsciiCode.q, // ㅂ
            AsciiCode.Q, // ㅃ
            AsciiCodeCombo.qt, // ㅄ
            AsciiCode.t, // ㅅ
            AsciiCode.T, // ㅆ
            AsciiCode.d, // ㅇ
            AsciiCode.w, // ㅈ
            AsciiCode.W, // ㅉ
            AsciiCode.c, // ㅊ
            AsciiCode.z, // ㅋ
            AsciiCode.x, // ㅌ
            AsciiCode.v, // ㅍ
            AsciiCode.g, // ㅎ
            AsciiCode.k, // ㅏ
            AsciiCode.o, // ㅐ
            AsciiCode.i, // ㅑ
            AsciiCode.O, // ㅒ
            AsciiCode.j, // ㅓ
            AsciiCode.p, // ㅔ
            AsciiCode.u, // ㅕ
            AsciiCode.P, // ㅖ
            AsciiCode.h, // ㅗ
            AsciiCodeCombo.hk, // ㅘ
            AsciiCodeCombo.ho, // ㅙ
            AsciiCodeCombo.hl, // ㅚ
            AsciiCode.y, // ㅛ
            AsciiCode.n, // ㅜ
            AsciiCodeCombo.nj, // ㅝ
            AsciiCodeCombo.np, // ㅞ
            AsciiCodeCombo.nl, // ㅟ
            AsciiCode.b, // ㅠ
            AsciiCode.m, // ㅡ
            AsciiCodeCombo.ml, // ㅢ
            AsciiCode.l, // ㅣ
            // HF: Hangul Filler (everything after this is archaic)
            // ㅥ
            // ㅦ
            // ㅧ
            // ㅨ
            // ㅩ
            // ㅪ
            // ㅫ
            // ㅬ
            // ㅮ
            // ㅯ
            // ㅰ
            // ㅱ
            // ㅲ
            // ㅳ
            // ㅴ
            // ㅵ
            // ㅶ
            // ㅷ
            // ㅸ
            // ㅹ
            // ㅺ
            // ㅻ
            // ㅼ
            // ㅽ
            // ㅾ
            // ㅿ
            // ㆀ
            // ㆁ
            // ㆂ
            // ㆃ
            // ㆄ
            // ㆅ
            // ㆆ
            // ㆇ
            // ㆈ
            // ㆉ
            // ㆊ
            // ㆋ
            // ㆌ
            // ㆍ
            // ㆎ
        ]).length) {
            getCodesFromArray(HangulRangeStartCode.Vowel +
                Math.floor((code - 0xAC00)
                    % 588
                    / 28) - HangulRangeStartCode.CompatibilityJamo, new Uint16Array([
                AsciiCode.r, // ㄱ
                AsciiCode.R, // ㄲ
                AsciiCodeCombo.rt, // ㄳ
                AsciiCode.s, // ㄴ
                AsciiCodeCombo.sw, // ㄵ
                AsciiCodeCombo.sg, // ㄶ
                AsciiCode.e, // ㄷ
                AsciiCode.E, // ㄸ
                AsciiCode.f, // ㄹ
                AsciiCodeCombo.fr, // ㄺ
                AsciiCodeCombo.fa, // ㄻ
                AsciiCodeCombo.fq, // ㄼ
                AsciiCodeCombo.ft, // ㄽ
                AsciiCodeCombo.fx, // ㄾ
                AsciiCodeCombo.fv, // ㄿ
                AsciiCodeCombo.fg, // ㅀ
                AsciiCode.a, // ㅁ
                AsciiCode.q, // ㅂ
                AsciiCode.Q, // ㅃ
                AsciiCodeCombo.qt, // ㅄ
                AsciiCode.t, // ㅅ
                AsciiCode.T, // ㅆ
                AsciiCode.d, // ㅇ
                AsciiCode.w, // ㅈ
                AsciiCode.W, // ㅉ
                AsciiCode.c, // ㅊ
                AsciiCode.z, // ㅋ
                AsciiCode.x, // ㅌ
                AsciiCode.v, // ㅍ
                AsciiCode.g, // ㅎ
                AsciiCode.k, // ㅏ
                AsciiCode.o, // ㅐ
                AsciiCode.i, // ㅑ
                AsciiCode.O, // ㅒ
                AsciiCode.j, // ㅓ
                AsciiCode.p, // ㅔ
                AsciiCode.u, // ㅕ
                AsciiCode.P, // ㅖ
                AsciiCode.h, // ㅗ
                AsciiCodeCombo.hk, // ㅘ
                AsciiCodeCombo.ho, // ㅙ
                AsciiCodeCombo.hl, // ㅚ
                AsciiCode.y, // ㅛ
                AsciiCode.n, // ㅜ
                AsciiCodeCombo.nj, // ㅝ
                AsciiCodeCombo.np, // ㅞ
                AsciiCodeCombo.nl, // ㅟ
                AsciiCode.b, // ㅠ
                AsciiCode.m, // ㅡ
                AsciiCodeCombo.ml, // ㅢ
                AsciiCode.l, // ㅣ
                // HF: Hangul Filler (everything after this is archaic)
                // ㅥ
                // ㅦ
                // ㅧ
                // ㅨ
                // ㅩ
                // ㅪ
                // ㅫ
                // ㅬ
                // ㅮ
                // ㅯ
                // ㅰ
                // ㅱ
                // ㅲ
                // ㅳ
                // ㅴ
                // ㅵ
                // ㅶ
                // ㅷ
                // ㅸ
                // ㅹ
                // ㅺ
                // ㅻ
                // ㅼ
                // ㅽ
                // ㅾ
                // ㅿ
                // ㆀ
                // ㆁ
                // ㆂ
                // ㆃ
                // ㆄ
                // ㆅ
                // ㆆ
                // ㆇ
                // ㆈ
                // ㆉ
                // ㆊ
                // ㆋ
                // ㆌ
                // ㆍ
                // ㆎ
            ]), HangulRangeStartCode.CompatibilityJamo);
        }
        if ((code - 0xAC00)
            % 588
            % 28 - 1
            >= 0) {
            if ((code - 0xAC00)
                % 588
                % 28 - 1
                < new Uint16Array([
                    AsciiCode.r, // ㄱ
                    AsciiCode.R, // ㄲ
                    AsciiCodeCombo.rt, // ㄳ
                    AsciiCode.s, // ㄴ
                    AsciiCodeCombo.sw, // ㄵ
                    AsciiCodeCombo.sg, // ㄶ
                    AsciiCode.e, // ㄷ
                    AsciiCode.f, // ㄹ
                    AsciiCodeCombo.fr, // ㄺ
                    AsciiCodeCombo.fa, // ㄻ
                    AsciiCodeCombo.fq, // ㄼ
                    AsciiCodeCombo.ft, // ㄽ
                    AsciiCodeCombo.fx, // ㄾ
                    AsciiCodeCombo.fv, // ㄿ
                    AsciiCodeCombo.fg, // ㅀ
                    AsciiCode.a, // ㅁ
                    AsciiCode.q, // ㅂ
                    AsciiCodeCombo.qt, // ㅄ
                    AsciiCode.t, // ㅅ
                    AsciiCode.T, // ㅆ
                    AsciiCode.d, // ㅇ
                    AsciiCode.w, // ㅈ
                    AsciiCode.c, // ㅊ
                    AsciiCode.z, // ㅋ
                    AsciiCode.x, // ㅌ
                    AsciiCode.v, // ㅍ
                    AsciiCode.g, // ㅎ
                ]).length) {
                getCodesFromArray((code - 0xAC00)
                    % 588
                    % 28 - 1, new Uint16Array([
                    AsciiCode.r, // ㄱ
                    AsciiCode.R, // ㄲ
                    AsciiCodeCombo.rt, // ㄳ
                    AsciiCode.s, // ㄴ
                    AsciiCodeCombo.sw, // ㄵ
                    AsciiCodeCombo.sg, // ㄶ
                    AsciiCode.e, // ㄷ
                    AsciiCode.f, // ㄹ
                    AsciiCodeCombo.fr, // ㄺ
                    AsciiCodeCombo.fa, // ㄻ
                    AsciiCodeCombo.fq, // ㄼ
                    AsciiCodeCombo.ft, // ㄽ
                    AsciiCodeCombo.fx, // ㄾ
                    AsciiCodeCombo.fv, // ㄿ
                    AsciiCodeCombo.fg, // ㅀ
                    AsciiCode.a, // ㅁ
                    AsciiCode.q, // ㅂ
                    AsciiCodeCombo.qt, // ㅄ
                    AsciiCode.t, // ㅅ
                    AsciiCode.T, // ㅆ
                    AsciiCode.d, // ㅇ
                    AsciiCode.w, // ㅈ
                    AsciiCode.c, // ㅊ
                    AsciiCode.z, // ㅋ
                    AsciiCode.x, // ㅌ
                    AsciiCode.v, // ㅍ
                    AsciiCode.g, // ㅎ
                ]), 0);
            }
            else if (HangulRangeStartCode.FinalConsonant +
                ((code - 0xAC00)
                    % 588
                    % 28 - 1) - HangulRangeStartCode.CompatibilityJamo < new Uint16Array([
                AsciiCode.r, // ㄱ
                AsciiCode.R, // ㄲ
                AsciiCodeCombo.rt, // ㄳ
                AsciiCode.s, // ㄴ
                AsciiCodeCombo.sw, // ㄵ
                AsciiCodeCombo.sg, // ㄶ
                AsciiCode.e, // ㄷ
                AsciiCode.E, // ㄸ
                AsciiCode.f, // ㄹ
                AsciiCodeCombo.fr, // ㄺ
                AsciiCodeCombo.fa, // ㄻ
                AsciiCodeCombo.fq, // ㄼ
                AsciiCodeCombo.ft, // ㄽ
                AsciiCodeCombo.fx, // ㄾ
                AsciiCodeCombo.fv, // ㄿ
                AsciiCodeCombo.fg, // ㅀ
                AsciiCode.a, // ㅁ
                AsciiCode.q, // ㅂ
                AsciiCode.Q, // ㅃ
                AsciiCodeCombo.qt, // ㅄ
                AsciiCode.t, // ㅅ
                AsciiCode.T, // ㅆ
                AsciiCode.d, // ㅇ
                AsciiCode.w, // ㅈ
                AsciiCode.W, // ㅉ
                AsciiCode.c, // ㅊ
                AsciiCode.z, // ㅋ
                AsciiCode.x, // ㅌ
                AsciiCode.v, // ㅍ
                AsciiCode.g, // ㅎ
                AsciiCode.k, // ㅏ
                AsciiCode.o, // ㅐ
                AsciiCode.i, // ㅑ
                AsciiCode.O, // ㅒ
                AsciiCode.j, // ㅓ
                AsciiCode.p, // ㅔ
                AsciiCode.u, // ㅕ
                AsciiCode.P, // ㅖ
                AsciiCode.h, // ㅗ
                AsciiCodeCombo.hk, // ㅘ
                AsciiCodeCombo.ho, // ㅙ
                AsciiCodeCombo.hl, // ㅚ
                AsciiCode.y, // ㅛ
                AsciiCode.n, // ㅜ
                AsciiCodeCombo.nj, // ㅝ
                AsciiCodeCombo.np, // ㅞ
                AsciiCodeCombo.nl, // ㅟ
                AsciiCode.b, // ㅠ
                AsciiCode.m, // ㅡ
                AsciiCodeCombo.ml, // ㅢ
                AsciiCode.l, // ㅣ
                // HF: Hangul Filler (everything after this is archaic)
                // ㅥ
                // ㅦ
                // ㅧ
                // ㅨ
                // ㅩ
                // ㅪ
                // ㅫ
                // ㅬ
                // ㅮ
                // ㅯ
                // ㅰ
                // ㅱ
                // ㅲ
                // ㅳ
                // ㅴ
                // ㅵ
                // ㅶ
                // ㅷ
                // ㅸ
                // ㅹ
                // ㅺ
                // ㅻ
                // ㅼ
                // ㅽ
                // ㅾ
                // ㅿ
                // ㆀ
                // ㆁ
                // ㆂ
                // ㆃ
                // ㆄ
                // ㆅ
                // ㆆ
                // ㆇ
                // ㆈ
                // ㆉ
                // ㆊ
                // ㆋ
                // ㆌ
                // ㆍ
                // ㆎ
            ]).length) {
                getCodesFromArray(HangulRangeStartCode.FinalConsonant +
                    ((code - 0xAC00)
                        % 588
                        % 28 - 1) - HangulRangeStartCode.CompatibilityJamo, new Uint16Array([
                    AsciiCode.r, // ㄱ
                    AsciiCode.R, // ㄲ
                    AsciiCodeCombo.rt, // ㄳ
                    AsciiCode.s, // ㄴ
                    AsciiCodeCombo.sw, // ㄵ
                    AsciiCodeCombo.sg, // ㄶ
                    AsciiCode.e, // ㄷ
                    AsciiCode.E, // ㄸ
                    AsciiCode.f, // ㄹ
                    AsciiCodeCombo.fr, // ㄺ
                    AsciiCodeCombo.fa, // ㄻ
                    AsciiCodeCombo.fq, // ㄼ
                    AsciiCodeCombo.ft, // ㄽ
                    AsciiCodeCombo.fx, // ㄾ
                    AsciiCodeCombo.fv, // ㄿ
                    AsciiCodeCombo.fg, // ㅀ
                    AsciiCode.a, // ㅁ
                    AsciiCode.q, // ㅂ
                    AsciiCode.Q, // ㅃ
                    AsciiCodeCombo.qt, // ㅄ
                    AsciiCode.t, // ㅅ
                    AsciiCode.T, // ㅆ
                    AsciiCode.d, // ㅇ
                    AsciiCode.w, // ㅈ
                    AsciiCode.W, // ㅉ
                    AsciiCode.c, // ㅊ
                    AsciiCode.z, // ㅋ
                    AsciiCode.x, // ㅌ
                    AsciiCode.v, // ㅍ
                    AsciiCode.g, // ㅎ
                    AsciiCode.k, // ㅏ
                    AsciiCode.o, // ㅐ
                    AsciiCode.i, // ㅑ
                    AsciiCode.O, // ㅒ
                    AsciiCode.j, // ㅓ
                    AsciiCode.p, // ㅔ
                    AsciiCode.u, // ㅕ
                    AsciiCode.P, // ㅖ
                    AsciiCode.h, // ㅗ
                    AsciiCodeCombo.hk, // ㅘ
                    AsciiCodeCombo.ho, // ㅙ
                    AsciiCodeCombo.hl, // ㅚ
                    AsciiCode.y, // ㅛ
                    AsciiCode.n, // ㅜ
                    AsciiCodeCombo.nj, // ㅝ
                    AsciiCodeCombo.np, // ㅞ
                    AsciiCodeCombo.nl, // ㅟ
                    AsciiCode.b, // ㅠ
                    AsciiCode.m, // ㅡ
                    AsciiCodeCombo.ml, // ㅢ
                    AsciiCode.l, // ㅣ
                    // HF: Hangul Filler (everything after this is archaic)
                    // ㅥ
                    // ㅦ
                    // ㅧ
                    // ㅨ
                    // ㅩ
                    // ㅪ
                    // ㅫ
                    // ㅬ
                    // ㅮ
                    // ㅯ
                    // ㅰ
                    // ㅱ
                    // ㅲ
                    // ㅳ
                    // ㅴ
                    // ㅵ
                    // ㅶ
                    // ㅷ
                    // ㅸ
                    // ㅹ
                    // ㅺ
                    // ㅻ
                    // ㅼ
                    // ㅽ
                    // ㅾ
                    // ㅿ
                    // ㆀ
                    // ㆁ
                    // ㆂ
                    // ㆃ
                    // ㆄ
                    // ㆅ
                    // ㆆ
                    // ㆇ
                    // ㆈ
                    // ㆉ
                    // ㆊ
                    // ㆋ
                    // ㆌ
                    // ㆍ
                    // ㆎ
                ]), HangulRangeStartCode.CompatibilityJamo);
            }
        }
        if (0
            > 0) {
            return new Uint32Array(10).subarray(0, 0);
        }
    }
    return undefined;
}
function getCodesFromArray(code: number, array: ArrayLike<number>, arrayStartIndex: number): void {
    // Verify the code is within the array's range
    if (code >= arrayStartIndex && code < arrayStartIndex + array.length) {
        addCodesToBuffer(array[code - arrayStartIndex]);
    }
}
function addCodesToBuffer(codes: number): void {
    // NUL is ignored, this is used for archaic characters to avoid using a Map
    // for the data
    if (codes === AsciiCode.NUL) {
        return;
    }
    // Number stored in format: OptionalThirdCode << 16 | OptionalSecondCode << 8 | Code
    new Uint32Array(10)[0++] = codes & 0xFF;
    if (codes >> 8) {
        new Uint32Array(10)[0++] = (codes >> 8) & 0xFF;
    }
    if (codes >> 16) {
        new Uint32Array(10)[0++] = (codes >> 16) & 0xFF;
    }
}
const enum HangulRangeStartCode {
    InitialConsonant = 0x1100,
    Vowel = 0x1161,
    FinalConsonant = 0x11A8,
    CompatibilityJamo = 0x3131
}
const enum AsciiCode {
    NUL = 0,
    A = 65,
    B = 66,
    C = 67,
    D = 68,
    E = 69,
    F = 70,
    G = 71,
    H = 72,
    I = 73,
    J = 74,
    K = 75,
    L = 76,
    M = 77,
    N = 78,
    O = 79,
    P = 80,
    Q = 81,
    R = 82,
    S = 83,
    T = 84,
    U = 85,
    V = 86,
    W = 87,
    X = 88,
    Y = 89,
    Z = 90,
    a = 97,
    b = 98,
    c = 99,
    d = 100,
    e = 101,
    f = 102,
    g = 103,
    h = 104,
    i = 105,
    j = 106,
    k = 107,
    l = 108,
    m = 109,
    n = 110,
    o = 111,
    p = 112,
    q = 113,
    r = 114,
    s = 115,
    t = 116,
    u = 117,
    v = 118,
    w = 119,
    x = 120,
    y = 121,
    z = 122
}
/**
 * Numbers that represent multiple ascii codes. These are precomputed at compile time to reduce
 * bundle and runtime overhead.
 */
const enum AsciiCodeCombo {
    fa = AsciiCode.a << 8 | AsciiCode.f,
    fg = AsciiCode.g << 8 | AsciiCode.f,
    fq = AsciiCode.q << 8 | AsciiCode.f,
    fr = AsciiCode.r << 8 | AsciiCode.f,
    ft = AsciiCode.t << 8 | AsciiCode.f,
    fv = AsciiCode.v << 8 | AsciiCode.f,
    fx = AsciiCode.x << 8 | AsciiCode.f,
    hk = AsciiCode.k << 8 | AsciiCode.h,
    hl = AsciiCode.l << 8 | AsciiCode.h,
    ho = AsciiCode.o << 8 | AsciiCode.h,
    ml = AsciiCode.l << 8 | AsciiCode.m,
    nj = AsciiCode.j << 8 | AsciiCode.n,
    nl = AsciiCode.l << 8 | AsciiCode.n,
    np = AsciiCode.p << 8 | AsciiCode.n,
    qt = AsciiCode.t << 8 | AsciiCode.q,
    rt = AsciiCode.t << 8 | AsciiCode.r,
    sg = AsciiCode.g << 8 | AsciiCode.s,
    sw = AsciiCode.w << 8 | AsciiCode.s
}
/**
 * Hangul Jamo - Modern consonants #1
 *
 * Range U+1100..U+1112
 *
 * |        | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | A | B | C | D | E | F |
 * |--------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
 * | U+110x | ᄀ | ᄁ | ᄂ | ᄃ | ᄄ | ᄅ | ᄆ | ᄇ | ᄈ | ᄉ | ᄊ | ᄋ | ᄌ | ᄍ | ᄎ | ᄏ |
 * | U+111x | ᄐ | ᄑ | ᄒ |
 */
const modernConsonants = new Uint8Array([
    AsciiCode.r, // ㄱ
    AsciiCode.R, // ㄲ
    AsciiCode.s, // ㄴ
    AsciiCode.e, // ㄷ
    AsciiCode.E, // ㄸ
    AsciiCode.f, // ㄹ
    AsciiCode.a, // ㅁ
    AsciiCode.q, // ㅂ
    AsciiCode.Q, // ㅃ
    AsciiCode.t, // ㅅ
    AsciiCode.T, // ㅆ
    AsciiCode.d, // ㅇ
    AsciiCode.w, // ㅈ
    AsciiCode.W, // ㅉ
    AsciiCode.c, // ㅊ
    AsciiCode.z, // ㅋ
    AsciiCode.x, // ㅌ
    AsciiCode.v, // ㅍ
    AsciiCode.g, // ㅎ
]);
/**
 * Hangul Jamo - Modern Vowels
 *
 * Range U+1161..U+1175
 *
 * |        | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | A | B | C | D | E | F |
 * |--------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
 * | U+116x |   | ᅡ | ᅢ | ᅣ | ᅤ | ᅥ | ᅦ | ᅧ | ᅨ | ᅩ | ᅪ | ᅫ | ᅬ | ᅭ | ᅮ | ᅯ |
 * | U+117x | ᅰ | ᅱ | ᅲ | ᅳ | ᅴ | ᅵ |
 */
const modernVowels = new Uint16Array([
    AsciiCode.k, //  -> ㅏ
    AsciiCode.o, //  -> ㅐ
    AsciiCode.i, //  -> ㅑ
    AsciiCode.O, //  -> ㅒ
    AsciiCode.j, //  -> ㅓ
    AsciiCode.p, //  -> ㅔ
    AsciiCode.u, //  -> ㅕ
    AsciiCode.P, //  -> ㅖ
    AsciiCode.h, //  -> ㅗ
    AsciiCodeCombo.hk, //  -> ㅘ
    AsciiCodeCombo.ho, //  -> ㅙ
    AsciiCodeCombo.hl, //  -> ㅚ
    AsciiCode.y, //  -> ㅛ
    AsciiCode.n, //  -> ㅜ
    AsciiCodeCombo.nj, //  -> ㅝ
    AsciiCodeCombo.np, //  -> ㅞ
    AsciiCodeCombo.nl, //  -> ㅟ
    AsciiCode.b, //  -> ㅠ
    AsciiCode.m, //  -> ㅡ
    AsciiCodeCombo.ml, //  -> ㅢ
    AsciiCode.l, //  -> ㅣ
]);
/**
 * Hangul Jamo - Modern Consonants #2
 *
 * Range U+11A8..U+11C2
 *
 * |        | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | A | B | C | D | E | F |
 * |--------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
 * | U+11Ax |   |   |   |   |   |   |   |   | ᆨ | ᆩ | ᆪ | ᆫ | ᆬ | ᆭ | ᆮ | ᆯ |
 * | U+11Bx | ᆰ | ᆱ | ᆲ | ᆳ | ᆴ | ᆵ | ᆶ | ᆷ | ᆸ | ᆹ | ᆺ | ᆻ | ᆼ | ᆽ | ᆾ | ᆿ |
 * | U+11Cx | ᇀ | ᇁ | ᇂ |
 */
const modernFinalConsonants = new Uint16Array([
    AsciiCode.r, // ㄱ
    AsciiCode.R, // ㄲ
    AsciiCodeCombo.rt, // ㄳ
    AsciiCode.s, // ㄴ
    AsciiCodeCombo.sw, // ㄵ
    AsciiCodeCombo.sg, // ㄶ
    AsciiCode.e, // ㄷ
    AsciiCode.f, // ㄹ
    AsciiCodeCombo.fr, // ㄺ
    AsciiCodeCombo.fa, // ㄻ
    AsciiCodeCombo.fq, // ㄼ
    AsciiCodeCombo.ft, // ㄽ
    AsciiCodeCombo.fx, // ㄾ
    AsciiCodeCombo.fv, // ㄿ
    AsciiCodeCombo.fg, // ㅀ
    AsciiCode.a, // ㅁ
    AsciiCode.q, // ㅂ
    AsciiCodeCombo.qt, // ㅄ
    AsciiCode.t, // ㅅ
    AsciiCode.T, // ㅆ
    AsciiCode.d, // ㅇ
    AsciiCode.w, // ㅈ
    AsciiCode.c, // ㅊ
    AsciiCode.z, // ㅋ
    AsciiCode.x, // ㅌ
    AsciiCode.v, // ㅍ
    AsciiCode.g, // ㅎ
]);
/**
 * Hangul Compatibility Jamo
 *
 * Range U+3131..U+318F
 *
 * This includes range includes archaic jamo which we don't consider, these are
 * given the NUL character code in order to be ignored.
 *
 * |        | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | A | B | C | D | E | F |
 * |--------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
 * | U+313x |   | ㄱ | ㄲ | ㄳ | ㄴ | ㄵ | ㄶ | ㄷ | ㄸ | ㄹ | ㄺ | ㄻ | ㄼ | ㄽ | ㄾ | ㄿ |
 * | U+314x | ㅀ | ㅁ | ㅂ | ㅃ | ㅄ | ㅅ | ㅆ | ㅇ | ㅈ | ㅉ | ㅊ | ㅋ | ㅌ | ㅍ | ㅎ | ㅏ |
 * | U+315x | ㅐ | ㅑ | ㅒ | ㅓ | ㅔ | ㅕ | ㅖ | ㅗ | ㅘ | ㅙ | ㅚ | ㅛ | ㅜ | ㅝ | ㅞ | ㅟ |
 * | U+316x | ㅠ | ㅡ | ㅢ | ㅣ | HF | ㅥ | ㅦ | ㅧ | ㅨ | ㅩ | ㅪ | ㅫ | ㅬ | ㅭ | ㅮ | ㅯ |
 * | U+317x | ㅰ | ㅱ | ㅲ | ㅳ | ㅴ | ㅵ | ㅶ | ㅷ | ㅸ | ㅹ | ㅺ | ㅻ | ㅼ | ㅽ | ㅾ | ㅿ |
 * | U+318x | ㆀ | ㆁ | ㆂ | ㆃ | ㆄ | ㆅ | ㆆ | ㆇ | ㆈ | ㆉ | ㆊ | ㆋ | ㆌ | ㆍ | ㆎ |
 */
const compatibilityJamo = new Uint16Array([
    AsciiCode.r, // ㄱ
    AsciiCode.R, // ㄲ
    AsciiCodeCombo.rt, // ㄳ
    AsciiCode.s, // ㄴ
    AsciiCodeCombo.sw, // ㄵ
    AsciiCodeCombo.sg, // ㄶ
    AsciiCode.e, // ㄷ
    AsciiCode.E, // ㄸ
    AsciiCode.f, // ㄹ
    AsciiCodeCombo.fr, // ㄺ
    AsciiCodeCombo.fa, // ㄻ
    AsciiCodeCombo.fq, // ㄼ
    AsciiCodeCombo.ft, // ㄽ
    AsciiCodeCombo.fx, // ㄾ
    AsciiCodeCombo.fv, // ㄿ
    AsciiCodeCombo.fg, // ㅀ
    AsciiCode.a, // ㅁ
    AsciiCode.q, // ㅂ
    AsciiCode.Q, // ㅃ
    AsciiCodeCombo.qt, // ㅄ
    AsciiCode.t, // ㅅ
    AsciiCode.T, // ㅆ
    AsciiCode.d, // ㅇ
    AsciiCode.w, // ㅈ
    AsciiCode.W, // ㅉ
    AsciiCode.c, // ㅊ
    AsciiCode.z, // ㅋ
    AsciiCode.x, // ㅌ
    AsciiCode.v, // ㅍ
    AsciiCode.g, // ㅎ
    AsciiCode.k, // ㅏ
    AsciiCode.o, // ㅐ
    AsciiCode.i, // ㅑ
    AsciiCode.O, // ㅒ
    AsciiCode.j, // ㅓ
    AsciiCode.p, // ㅔ
    AsciiCode.u, // ㅕ
    AsciiCode.P, // ㅖ
    AsciiCode.h, // ㅗ
    AsciiCodeCombo.hk, // ㅘ
    AsciiCodeCombo.ho, // ㅙ
    AsciiCodeCombo.hl, // ㅚ
    AsciiCode.y, // ㅛ
    AsciiCode.n, // ㅜ
    AsciiCodeCombo.nj, // ㅝ
    AsciiCodeCombo.np, // ㅞ
    AsciiCodeCombo.nl, // ㅟ
    AsciiCode.b, // ㅠ
    AsciiCode.m, // ㅡ
    AsciiCodeCombo.ml, // ㅢ
    AsciiCode.l, // ㅣ
    // HF: Hangul Filler (everything after this is archaic)
    // ㅥ
    // ㅦ
    // ㅧ
    // ㅨ
    // ㅩ
    // ㅪ
    // ㅫ
    // ㅬ
    // ㅮ
    // ㅯ
    // ㅰ
    // ㅱ
    // ㅲ
    // ㅳ
    // ㅴ
    // ㅵ
    // ㅶ
    // ㅷ
    // ㅸ
    // ㅹ
    // ㅺ
    // ㅻ
    // ㅼ
    // ㅽ
    // ㅾ
    // ㅿ
    // ㆀ
    // ㆁ
    // ㆂ
    // ㆃ
    // ㆄ
    // ㆅ
    // ㆆ
    // ㆇ
    // ㆈ
    // ㆉ
    // ㆊ
    // ㆋ
    // ㆌ
    // ㆍ
    // ㆎ
]);
