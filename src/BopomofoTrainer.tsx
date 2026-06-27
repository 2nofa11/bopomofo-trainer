import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";

type Consonant = { z: string; p: string; place: string; manner: string };
type Vowel = { z: string; p: string; group: string };
type Item = Consonant | Vowel;

/* ───────────────────────────── データ ─────────────────────────────
   出典: 「ボポモフォと発音のコツ.pdf」(モーガンの台湾中国語講座 / Morgan Mandarin)
   子音は「調音位置(行) × 調音方法(列)」のマトリクスで構成される。
   空欄は実在しない組み合わせ＝音韻上のギャップであり、意味のある情報なので残す。
*/

const PLACES = ["両唇音", "唇歯音", "舌尖音", "舌根音", "舌面音", "そり舌音", "舌歯音"];
const MANNERS = ["無気音", "有気音", "鼻音", "摩擦音", "有声音"];

const CONSONANTS = [
  { z: "ㄅ", p: "b", place: "両唇音", manner: "無気音" },
  { z: "ㄆ", p: "p", place: "両唇音", manner: "有気音" },
  { z: "ㄇ", p: "m", place: "両唇音", manner: "鼻音" },
  { z: "ㄈ", p: "f", place: "唇歯音", manner: "摩擦音" },
  { z: "ㄉ", p: "d", place: "舌尖音", manner: "無気音" },
  { z: "ㄊ", p: "t", place: "舌尖音", manner: "有気音" },
  { z: "ㄋ", p: "n", place: "舌尖音", manner: "鼻音" },
  { z: "ㄌ", p: "l", place: "舌尖音", manner: "有声音" },
  { z: "ㄍ", p: "g", place: "舌根音", manner: "無気音" },
  { z: "ㄎ", p: "k", place: "舌根音", manner: "有気音" },
  { z: "ㄏ", p: "h", place: "舌根音", manner: "摩擦音" },
  { z: "ㄐ", p: "j", place: "舌面音", manner: "無気音" },
  { z: "ㄑ", p: "q", place: "舌面音", manner: "有気音" },
  { z: "ㄒ", p: "x", place: "舌面音", manner: "摩擦音" },
  { z: "ㄓ", p: "zh", place: "そり舌音", manner: "無気音" },
  { z: "ㄔ", p: "ch", place: "そり舌音", manner: "有気音" },
  { z: "ㄕ", p: "sh", place: "そり舌音", manner: "摩擦音" },
  { z: "ㄖ", p: "r", place: "そり舌音", manner: "有声音" },
  { z: "ㄗ", p: "z", place: "舌歯音", manner: "無気音" },
  { z: "ㄘ", p: "c", place: "舌歯音", manner: "有気音" },
  { z: "ㄙ", p: "s", place: "舌歯音", manner: "摩擦音" },
];

const VOWELS = [
  { z: "ㄧ", p: "i", group: "介音" },
  { z: "ㄨ", p: "u", group: "介音" },
  { z: "ㄩ", p: "yu", group: "介音" },
  { z: "ㄚ", p: "a", group: "単母音" },
  { z: "ㄛ", p: "o", group: "単母音" },
  { z: "ㄜ", p: "e", group: "単母音" },
  { z: "ㄝ", p: "ê", group: "単母音" },
  { z: "ㄞ", p: "ai", group: "複母音" },
  { z: "ㄟ", p: "ei", group: "複母音" },
  { z: "ㄠ", p: "ao", group: "複母音" },
  { z: "ㄡ", p: "ou", group: "複母音" },
  { z: "ㄢ", p: "an", group: "鼻母音" },
  { z: "ㄣ", p: "en", group: "鼻母音" },
  { z: "ㄤ", p: "ang", group: "鼻母音" },
  { z: "ㄥ", p: "eng", group: "鼻母音" },
  { z: "ㄦ", p: "er", group: "そり舌母音" },
];

const PLACE_TIPS: Record<string, string> = {
  両唇音: "上下両方の唇を使って発音します。",
  唇歯音: "下唇を上の歯に軽くあてて発音します。",
  舌尖音: "舌先を上の歯茎につけて発音します。",
  舌根音: "舌の付け根を奥に下げて発音します。",
  舌面音: "上下の前歯を軽く閉じ、舌先を下の歯茎につけたまま発音します。",
  そり舌音: "舌の平面が上下のあごに触れないように、舌先が起立している状態で、やや後ろに引っ込めながら、側面を軽く上の奥歯に押し付けて発音します。",
  舌歯音: "舌先を前歯の裏側に押しつけて発音します。",
};

const MANNER_TIPS: Record<string, string> = {
  無気音: "息を抑え気味で出します。",
  有気音: "息を強く吹き出します。",
  鼻音: "息を鼻に通して出します。",
  摩擦音: "のどを狭めて発音します。",
  有声音: "声帯の振動を伴って発音します。",
};

/* 母音の分類解説。元PDFのコツは子音専用のため、ここは標準的な音声学に基づく補足。 */
const VOWEL_GROUP_TIPS: Record<string, string> = {
  介音: "母音や子音の前に入って音をつなぐ半母音。単独でも音節になります（ㄧ＝一 など）。",
  単母音: "1つの母音だけで構成される、いちばん基本の音。",
  複母音: "2つの母音がなめらかにつながる二重母音。",
  鼻母音: "母音のあとに鼻音（-n / -ng）が付く音。",
  そり舌母音: "舌をそらせて出す特殊な母音（ㄦ のみ）。",
};

/* 母音の個別の発音のコツ（モーガンの台湾中国語講座のカードより文字起こし）。 */
const VOWEL_TIPS: Record<string, string> = {
  ㄧ: "日本語の「い」の音とほぼ同じです。「い」よりも、もっと口を横に開いて「い」と発音します。",
  ㄨ: "日本語の「う」の音とほぼ同じです。「う」よりも、唇をもっとすぼめて「う」と発音します。",
  ㄩ: "日本語にはない音です。唇は「ㄨ」よりさらに口をすぼめ、「い」と「ゆ」の中間くらいの気持ちで発音します。",
  ㄚ: "日本語の「あ」の音とほぼ同じです。ポイントは、口を大きく開けることを意識して「あ」と言います。",
  ㄛ: "唇をすぼめて「お」と言います。日本語の「お」よりも、「う」というように、口を突き出します。",
  ㄜ: "日本語にはない音です。英語の about の a の発音に近いです。口は、横に広げて発音します。",
  ㄝ: "ひらがなの「せ」みたいですが、音はまったく違います。日本語の「え」の音と同じ発音で大丈夫です。",
  ㄞ: "「あぃ」という風に、「あ」を強く発音し、「い」を小さくくっつける感じです。一つの音として滑らかに発音します。",
  ㄟ: "「えぃ」という風に、「え」を強く発音し、「い」を小さくくっつける感じです。一つの音として滑らかに発音します。",
  ㄠ: "「あぉ」という感じで「あ」を強く言ったあとに、「うの口」くらい口を突き出して「ぉ」をそえるイメージです。日本語の「お」よりも口を突き出すので、「あぉ」よりは「あぅ」に近い音になります。一つの音として滑らかに発音します。",
  ㄡ: "日本語の「おう」に近い音です。口を思いっきりすぼめ突き出して「お」を強く「おぅ」と発音します。一つの音として滑らかに発音します。",
  ㄢ: "「あん」の「ん」を発音するときに、舌を出して、歯で噛んで「ん」とちゃんと発音して終わらせます。",
  ㄣ: "「えん」の「ん」を発音するときに、舌尖を上の歯ぐきにつけ「ん」の音をはっきりと発音します。",
  ㄤ: "普通に「あん」と言ってみて、舌の後ろが上あごにくっついた状態にします。この状態で、鼻に息を通して「ん」と発音します。口を開いたまま、舌の後ろを上あごにくっつけて終わらせる音です。",
  ㄥ: "舌は「ㄤ」と同様に、口を開いたまま、舌の後ろが盛り上がって、上あごにくっついている状態で発音します。喉の奥で響く、「ㄜン」に近い音です。",
  ㄦ: "舌をそりあげて発音する音です。この音は単独で、この音のみ発音します。子音とくっつくことはありません。英語の発音、hard の r の発音に近いです。口を半開きにし、舌をそりあげて発音します。",
};

/* TTS用：各音に「その発音を持つ漢字」を割り当てる。
   ローマ字を中国語音声に渡すと誤読するため、漢字で読ませる。
   子音は単独発音できないので、注音の暗唱どおり既定母音つきの音にする(ㄅ→波 bo 等)。 */
const SAY: Record<string, string> = {
  ㄅ: "波",
  ㄆ: "坡",
  ㄇ: "摸",
  ㄈ: "佛",
  ㄉ: "德",
  ㄊ: "特",
  ㄋ: "呢",
  ㄌ: "勒",
  ㄍ: "哥",
  ㄎ: "科",
  ㄏ: "喝",
  ㄐ: "雞",
  ㄑ: "七",
  ㄒ: "西",
  ㄓ: "知",
  ㄔ: "吃",
  ㄕ: "詩",
  ㄖ: "日",
  ㄗ: "資",
  ㄘ: "詞",
  ㄙ: "思",
  ㄧ: "一",
  ㄨ: "烏",
  ㄩ: "魚",
  ㄚ: "啊",
  ㄛ: "喔",
  ㄜ: "鵝",
  ㄝ: "欸",
  ㄞ: "愛",
  ㄟ: "誒",
  ㄠ: "奧",
  ㄡ: "歐",
  ㄢ: "安",
  ㄣ: "恩",
  ㄤ: "昂",
  ㄥ: "鞥",
  ㄦ: "兒",
};

const EXAMPLE: Record<string, { word: string; gloss: string; zhuyin: string; pinyin: string }> = {
  ㄅ: { word: "爸爸", gloss: "パパ", zhuyin: "ㄅㄚˋ ㄅㄚ˙", pinyin: "bà ba" },
  ㄆ: { word: "蘋果", gloss: "りんご", zhuyin: "ㄆㄧㄥˊ ㄍㄨㄛˇ", pinyin: "píng guǒ" },
  ㄇ: { word: "媽媽", gloss: "ママ", zhuyin: "ㄇㄚ ㄇㄚ˙", pinyin: "mā ma" },
  ㄈ: { word: "飛機", gloss: "ひこうき", zhuyin: "ㄈㄟ ㄐㄧ", pinyin: "fēi jī" },
  ㄉ: { word: "大象", gloss: "ぞう", zhuyin: "ㄉㄚˋ ㄒㄧㄤˋ", pinyin: "dà xiàng" },
  ㄊ: { word: "太陽", gloss: "たいよう", zhuyin: "ㄊㄞˋ ㄧㄤˊ", pinyin: "tài yáng" },
  ㄋ: { word: "牛奶", gloss: "ぎゅうにゅう", zhuyin: "ㄋㄧㄡˊ ㄋㄞˇ", pinyin: "niú nǎi" },
  ㄌ: { word: "老虎", gloss: "トラ", zhuyin: "ㄌㄠˇ ㄏㄨˇ", pinyin: "lǎo hǔ" },
  ㄍ: { word: "狗", gloss: "いぬ", zhuyin: "ㄍㄡˇ", pinyin: "gǒu" },
  ㄎ: { word: "咖啡", gloss: "コーヒー", zhuyin: "ㄎㄚ ㄈㄟ", pinyin: "kā fēi" },
  ㄏ: { word: "花", gloss: "はな", zhuyin: "ㄏㄨㄚ", pinyin: "huā" },
  ㄐ: { word: "雞", gloss: "にわとり", zhuyin: "ㄐㄧ", pinyin: "jī" },
  ㄑ: { word: "汽車", gloss: "じどうしゃ", zhuyin: "ㄑㄧˋ ㄔㄜ", pinyin: "qì chē" },
  ㄒ: { word: "西瓜", gloss: "すいか", zhuyin: "ㄒㄧ ㄍㄨㄚ", pinyin: "xī guā" },
  ㄓ: { word: "豬", gloss: "ぶた", zhuyin: "ㄓㄨ", pinyin: "zhū" },
  ㄔ: { word: "茶", gloss: "おちゃ", zhuyin: "ㄔㄚˊ", pinyin: "chá" },
  ㄕ: { word: "書", gloss: "ほん", zhuyin: "ㄕㄨ", pinyin: "shū" },
  ㄖ: { word: "肉", gloss: "にく", zhuyin: "ㄖㄡˋ", pinyin: "ròu" },
  ㄗ: { word: "早餐", gloss: "あさごはん", zhuyin: "ㄗㄠˇ ㄘㄢ", pinyin: "zǎo cān" },
  ㄘ: { word: "草", gloss: "くさ", zhuyin: "ㄘㄠˇ", pinyin: "cǎo" },
  ㄙ: { word: "傘", gloss: "かさ", zhuyin: "ㄙㄢˇ", pinyin: "sǎn" },
  ㄧ: { word: "衣服", gloss: "ふく", zhuyin: "ㄧ ㄈㄨ˙", pinyin: "yī fu" },
  ㄨ: { word: "烏龜", gloss: "カメ", zhuyin: "ㄨ ㄍㄨㄟ", pinyin: "wū guī" },
  ㄩ: { word: "魚", gloss: "さかな", zhuyin: "ㄩˊ", pinyin: "yú" },
  ㄚ: { word: "阿姨", gloss: "おばさん", zhuyin: "ㄚ ㄧˊ", pinyin: "ā yí" },
  ㄛ: { word: "婆婆", gloss: "おばあさん", zhuyin: "ㄆㄛˊ ㄆㄛ˙", pinyin: "pó po" },
  ㄜ: { word: "鵝", gloss: "ガチョウ", zhuyin: "ㄜˊ", pinyin: "é" },
  ㄝ: { word: "寫", gloss: "かく", zhuyin: "ㄒㄧㄝˇ", pinyin: "xiě" },
  ㄞ: { word: "愛", gloss: "あい", zhuyin: "ㄞˋ", pinyin: "ài" },
  ㄟ: { word: "妹妹", gloss: "いもうと", zhuyin: "ㄇㄟˋ ㄇㄟ˙", pinyin: "mèi mei" },
  ㄠ: { word: "貓", gloss: "ねこ", zhuyin: "ㄇㄠ", pinyin: "māo" },
  ㄡ: { word: "藕", gloss: "れんこん", zhuyin: "ㄡˇ", pinyin: "ǒu" },
  ㄢ: { word: "山", gloss: "やま", zhuyin: "ㄕㄢ", pinyin: "shān" },
  ㄣ: { word: "人", gloss: "ひと", zhuyin: "ㄖㄣˊ", pinyin: "rén" },
  ㄤ: { word: "糖", gloss: "あめ", zhuyin: "ㄊㄤˊ", pinyin: "táng" },
  ㄥ: { word: "燈", gloss: "ランプ", zhuyin: "ㄉㄥ", pinyin: "dēng" },
  ㄦ: { word: "耳朵", gloss: "みみ", zhuyin: "ㄦˇ ㄉㄨㄛ˙", pinyin: "ěr duo" },
};

const ALL = [...CONSONANTS, ...VOWELS];
const byZ: Record<string, Consonant> = Object.fromEntries(
  CONSONANTS.map((c) => [`${c.place}|${c.manner}`, c]),
);

/* ───────────────────────── 永続ストレージ ─────────────────────────
   習得済みの注音符号を Set<string> として localStorage に保存する。
*/
const STORE_KEY = "bopomofo:mastered:v2";
const masteredStorage = {
  async load(): Promise<Set<string>> {
    try {
      const v = localStorage.getItem(STORE_KEY);
      return v ? new Set(JSON.parse(v) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  },
  async save(mastered: Set<string>) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify([...mastered]));
    } catch {
      /* 保存に失敗しても学習自体は続行できる */
    }
  },
  async clear() {
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* noop */
    }
  },
};

/* ───────────────────────────── スタイル ───────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap');

.bpmf{
  --paper:#F6F2E7; --paper2:#FBF8EF; --ink:#26332F; --sub:#5E6B64;
  --teal:#1E8A86; --teal-d:#16635F; --teal-soft:#D7ECE8;
  --amber:#F2B705; --amber-d:#C98F00;
  --coral:#DD6149; --moss:#5C9A6B; --line:#E0D8C4;
  --void:#EFE9D8; --rowhead:74px; --colmin:56px;
  font-family:"Zen Kaku Gothic New",system-ui,-apple-system,sans-serif;
  color:var(--ink); background:var(--paper);
  min-height:100vh; padding:clamp(14px,3vw,34px); padding-bottom:calc(clamp(14px,3vw,34px) + 60px);
  -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%; box-sizing:border-box;
}
.bpmf *{box-sizing:border-box;}
.bpmf .wrap{max-width:980px;margin:0 auto;}

.bpmf .head{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;margin-bottom:6px;}
.bpmf .mark{
  font-family:"Zen Maru Gothic",sans-serif;font-weight:900;
  background:var(--amber);color:var(--ink);
  padding:8px 12px 6px;border-radius:14px 14px 16px 12px;
  line-height:1;font-size:clamp(20px,4vw,30px);
  box-shadow:3px 4px 0 var(--amber-d); letter-spacing:.04em;
}
.bpmf h1{font-family:"Zen Maru Gothic",sans-serif;font-weight:900;
  font-size:clamp(18px,3.4vw,26px);margin:0;letter-spacing:.02em;}
.bpmf .lede{color:var(--sub);font-size:13.5px;margin:6px 0 18px;line-height:1.6;}

.bpmf .tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;}
.bpmf .tab{
  font-family:"Zen Maru Gothic",sans-serif;font-weight:700;font-size:15px;
  border:2px solid var(--ink);background:var(--paper2);color:var(--ink);
  padding:9px 16px;border-radius:12px;cursor:pointer;touch-action:manipulation;
  box-shadow:2px 3px 0 var(--ink);transition:transform .08s,box-shadow .08s,background .15s;
}
.bpmf .tab:hover{transform:translate(-1px,-1px);box-shadow:3px 4px 0 var(--ink);}
.bpmf .tab:active{transform:translate(1px,2px);box-shadow:1px 1px 0 var(--ink);}
.bpmf .tab[aria-selected="true"]{background:var(--teal);color:#fff;border-color:var(--teal-d);box-shadow:2px 3px 0 var(--teal-d);}
.bpmf .tab:focus-visible{outline:3px solid var(--amber);outline-offset:2px;}

.bpmf .card{background:var(--paper2);border-radius:18px;border:1px solid var(--line);
  padding:clamp(14px,2.5vw,24px);box-shadow:0 1px 0 #fff inset, 0 8px 22px -18px rgba(0,0,0,.4);}

.bpmf .secttl{font-family:"Zen Maru Gothic",sans-serif;font-weight:700;font-size:14px;
  color:var(--teal-d);letter-spacing:.06em;margin:0 0 12px;display:flex;align-items:center;gap:8px;}
.bpmf .secttl::before{content:"";width:18px;height:18px;border-radius:6px;background:var(--amber);
  box-shadow:1px 2px 0 var(--amber-d);}

/* マトリクス */
.bpmf .grid{display:grid;gap:6px;overflow-x:auto;padding-bottom:4px;
  grid-template-columns:var(--rowhead) repeat(var(--mcount,5),minmax(var(--colmin),1fr));}
.bpmf .gcell{min-width:0;}
.bpmf .gh{font-family:"Zen Maru Gothic",sans-serif;font-weight:700;font-size:12.5px;
  background:var(--teal-soft);color:var(--teal-d);border-radius:9px;
  display:flex;align-items:center;justify-content:center;text-align:center;
  padding:7px 4px;min-height:38px;cursor:help;}
.bpmf .gh.rh{background:#F5E7C9;color:#8a6a00;position:sticky;left:0;z-index:1;}
.bpmf .corner{background:var(--paper2);position:sticky;left:0;z-index:1;}

.bpmf .tile{
  border:none;width:100%;min-height:54px;border-radius:12px;cursor:pointer;touch-action:manipulation;
  font-family:"Zen Maru Gothic",sans-serif;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:1px;padding:6px 2px;
  background:var(--paper);box-shadow:2px 3px 0 rgba(0,0,0,.10);
  transition:transform .08s, box-shadow .08s;
}
.bpmf .tile:hover{transform:translate(-1px,-1px);box-shadow:3px 4px 0 rgba(0,0,0,.13);}
.bpmf .tile:active{transform:translate(1px,2px);box-shadow:1px 1px 0 rgba(0,0,0,.10);}
.bpmf .tile:focus-visible{outline:3px solid var(--amber);outline-offset:2px;}
.bpmf .tile .z{font-size:22px;font-weight:900;line-height:1;}
.bpmf .tile .p{font-size:12px;color:var(--sub);font-weight:700;}
.bpmf .tile.sel{background:var(--amber);box-shadow:2px 3px 0 var(--amber-d);}
.bpmf .tile.m0{background:#EAF4F2;} /* 無気 */
.bpmf .tile.m1{background:#FBEEDD;} /* 有気 */
.bpmf .tile.m2{background:#EFEAF6;} /* 鼻 */
.bpmf .tile.m3{background:#FCE9E4;} /* 摩擦 */
.bpmf .tile.m4{background:#E7F2E5;} /* 有声 */
.bpmf .void{background:var(--void);border-radius:12px;min-height:54px;
  display:flex;align-items:center;justify-content:center;color:#C9BFA4;font-size:18px;}

/* 母音 */
.bpmf .vgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
.bpmf .vgroup{font-size:11px;color:var(--sub);font-weight:700;grid-column:1/-1;margin-top:4px;}

/* 詳細パネル */
.bpmf .detail{margin-top:16px;background:var(--teal);color:#fff;border-radius:16px;padding:16px 18px;
  display:grid;grid-template-columns:auto 1fr;gap:4px 18px;align-items:start;}
.bpmf .detail .big{grid-row:1/4;font-family:"Zen Maru Gothic",sans-serif;font-weight:900;
  font-size:54px;line-height:1;align-self:center;}
.bpmf .detail .row{font-size:13.5px;line-height:1.55;}
.bpmf .detail b{color:var(--amber);font-weight:700;}
.bpmf .detail.placeholder{background:var(--paper);color:var(--sub);display:block;font-size:13.5px;text-align:center;border:1px dashed var(--line);}

/* フラッシュカード */
.bpmf .controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center;}
.bpmf .seg{display:inline-flex;border:2px solid var(--ink);border-radius:11px;overflow:hidden;box-shadow:2px 3px 0 var(--ink);}
.bpmf .seg button{font-family:"Zen Kaku Gothic New";font-weight:700;font-size:13px;border:none;
  background:var(--paper2);color:var(--ink);padding:7px 12px;cursor:pointer;touch-action:manipulation;}
.bpmf .seg button + button{border-left:2px solid var(--ink);}
.bpmf .seg button[aria-pressed="true"]{background:var(--ink);color:var(--paper2);}
.bpmf .seg button:focus-visible{outline:3px solid var(--amber);outline-offset:-1px;}

.bpmf .flash{background:var(--paper2);border-radius:22px;border:2px solid var(--ink);
  box-shadow:4px 6px 0 var(--ink);padding:40px 20px;text-align:center;cursor:pointer;touch-action:manipulation;
  min-height:230px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  user-select:none;transition:transform .08s;}
.bpmf .flash:active{transform:translate(2px,3px);}
.bpmf .flash:focus-visible{outline:3px solid var(--amber);outline-offset:3px;}
.bpmf .flash .q{font-family:"Zen Maru Gothic",sans-serif;font-weight:900;color:var(--ink);}
.bpmf .flash .q.zhuyin{font-size:96px;line-height:1;}
.bpmf .flash .q.text{font-size:54px;line-height:1.1;}
.bpmf .flash .hint{font-size:12.5px;color:var(--sub);}
.bpmf .flash .ans{font-size:15px;color:var(--teal-d);font-weight:700;line-height:1.6;margin-top:4px;}
.bpmf .flash .ans .pinyin{font-size:34px;color:var(--ink);display:block;margin-bottom:2px;}
.bpmf .tipline{font-size:12.5px;color:var(--sub);margin-top:6px;line-height:1.5;max-width:520px;}

.bpmf .flash .qword{display:flex;flex-direction:column;align-items:center;gap:1px;margin-top:4px;}
.bpmf .flash .qword .ew{font-family:"Zen Maru Gothic",sans-serif;font-weight:900;font-size:30px;color:var(--teal-d);line-height:1.15;}
.bpmf .flash .qword .eg{font-size:13px;color:var(--sub);font-weight:700;}
.bpmf .flash .qword .ezy{font-size:13px;color:var(--teal-d);font-weight:700;letter-spacing:.04em;}
@media (max-width:560px){.bpmf .flash .qword .ew{font-size:24px;}}

.bpmf .grades{display:flex;gap:10px;justify-content:center;margin-top:16px;}
.bpmf .grade{font-family:"Zen Maru Gothic",sans-serif;font-weight:700;font-size:15px;border:2px solid var(--ink);
  padding:10px 22px;border-radius:12px;cursor:pointer;touch-action:manipulation;box-shadow:2px 3px 0 var(--ink);background:var(--paper2);}
.bpmf .grade:active{transform:translate(1px,2px);box-shadow:1px 1px 0 var(--ink);}
.bpmf .grade:focus-visible{outline:3px solid var(--amber);outline-offset:2px;}
.bpmf .grade.no{color:var(--coral);} .bpmf .grade.yes{color:var(--moss);}
.bpmf .progress{display:flex;gap:16px;justify-content:center;align-items:center;margin-top:18px;
  font-size:13px;color:var(--sub);flex-wrap:wrap;}
.bpmf .pill{background:var(--paper2);border:1px solid var(--line);border-radius:20px;padding:4px 12px;font-weight:700;}
.bpmf .pill.g{color:var(--moss);}

.bpmf .complete{text-align:center;padding:32px 20px;display:flex;flex-direction:column;align-items:center;gap:16px;}
.bpmf .complete .big-check{font-size:56px;line-height:1;}
.bpmf .complete .msg{font-family:"Zen Maru Gothic",sans-serif;font-weight:700;font-size:18px;color:var(--moss);}
.bpmf .complete .sub{font-size:13.5px;color:var(--sub);}

/* チャート埋め */
.bpmf .fillgrid{display:grid;gap:6px;overflow-x:auto;padding-bottom:4px;
  grid-template-columns:var(--rowhead) repeat(var(--mcount,5),minmax(var(--colmin),1fr));}
.bpmf input.fc{width:100%;min-height:54px;border-radius:12px;border:2px solid var(--line);
  background:#fff;text-align:center;font-size:18px;font-family:"Zen Maru Gothic";font-weight:700;
  color:var(--ink);box-shadow:2px 3px 0 rgba(0,0,0,.06);padding:2px;}
.bpmf input.fc:focus{outline:none;border-color:var(--teal);box-shadow:0 0 0 3px var(--teal-soft);}
.bpmf input.fc.ok{border-color:var(--moss);background:#EAF6EC;}
.bpmf input.fc.ng{border-color:var(--coral);background:#FBEAE5;}
.bpmf input.fc.ng::placeholder{color:var(--coral);opacity:.9;}
.bpmf input.fc:disabled{opacity:1;-webkit-text-fill-color:var(--ink);}
.bpmf .fillzhuyin{font-size:11px;color:var(--sub);text-align:center;margin-top:2px;font-weight:700;}

.bpmf .btn{font-family:"Zen Maru Gothic";font-weight:700;font-size:15px;border:2px solid var(--ink);
  background:var(--amber);color:var(--ink);padding:10px 22px;border-radius:12px;cursor:pointer;touch-action:manipulation;
  box-shadow:2px 3px 0 var(--ink);}
.bpmf .btn:active{transform:translate(1px,2px);box-shadow:1px 1px 0 var(--ink);}
.bpmf .btn:focus-visible{outline:3px solid var(--teal);outline-offset:2px;}
.bpmf .btn.ghost{background:var(--paper2);}
.bpmf .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;align-items:center;}
.bpmf .score{font-family:"Zen Maru Gothic";font-weight:900;font-size:20px;}
.bpmf .score.good{color:var(--moss);} .bpmf .score.mid{color:var(--amber-d);}

.bpmf .foot{margin-top:22px;font-size:11.5px;color:var(--sub);line-height:1.7;text-align:center;}
.bpmf .foot a{color:var(--teal-d);}
.bpmf .reset{background:none;border:none;color:var(--sub);text-decoration:underline;cursor:pointer;font-size:11.5px;touch-action:manipulation;}

.bpmf .mute{margin-left:auto;font-family:"Zen Kaku Gothic New";font-weight:700;font-size:12.5px;
  border:2px solid var(--ink);background:var(--paper2);color:var(--ink);padding:6px 11px;border-radius:10px;
  cursor:pointer;touch-action:manipulation;box-shadow:2px 3px 0 var(--ink);}
.bpmf .mute:active{transform:translate(1px,2px);box-shadow:1px 1px 0 var(--ink);}
.bpmf .mute[aria-pressed="true"]{background:var(--void);color:var(--sub);}
.bpmf .mute:focus-visible{outline:3px solid var(--amber);outline-offset:2px;}

.bpmf .spk{font-family:"Zen Kaku Gothic New";font-weight:700;font-size:13px;border:2px solid #fff;
  background:rgba(255,255,255,.16);color:#fff;padding:4px 10px;border-radius:9px;cursor:pointer;touch-action:manipulation;}
.bpmf .flash .spk{border-color:var(--teal);background:var(--teal-soft);color:var(--teal-d);margin-top:8px;}
.bpmf .spk:active{transform:translate(1px,1px);}
.bpmf .spk:focus-visible{outline:3px solid var(--amber);outline-offset:2px;}

/* ピンインバー（固定下部） */
.bpmf .pinbar{
  position:fixed;bottom:0;left:0;right:0;z-index:100;
  background:var(--teal);color:#fff;
  padding:10px clamp(14px,3vw,34px) max(10px,env(safe-area-inset-bottom,0px));
  display:grid;grid-template-columns:52px 1fr auto;gap:2px 14px;
  box-shadow:0 -3px 16px rgba(0,0,0,.22);
}
.bpmf .pinbar .pbig{
  grid-column:1;grid-row:1/3;align-self:center;
  font-family:"Zen Maru Gothic",sans-serif;font-weight:900;
  font-size:40px;line-height:1;text-align:center;
}
.bpmf .pinbar .ppinyin{
  grid-column:2;font-size:16px;font-weight:700;
  display:flex;align-items:center;gap:8px;
}
.bpmf .pinbar .ptip{
  grid-column:2;font-size:11.5px;line-height:1.4;color:rgba(255,255,255,.85);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.bpmf .pinbar .pspk{
  grid-column:3;grid-row:1/3;align-self:center;
  font-family:"Zen Kaku Gothic New";font-weight:700;font-size:13px;
  border:2px solid rgba(255,255,255,.5);background:rgba(255,255,255,.16);
  color:#fff;padding:6px 10px;border-radius:9px;cursor:pointer;touch-action:manipulation;
}
.bpmf .pinbar .pspk:focus-visible{outline:3px solid var(--amber);outline-offset:2px;}
.bpmf .pinbar.empty{
  position:fixed;bottom:0;left:0;right:0;z-index:100;
  background:var(--paper2);color:var(--sub);font-size:13px;text-align:center;
  border-top:1px solid var(--line);
  padding:12px clamp(14px,3vw,34px) max(12px,env(safe-area-inset-bottom,0px));
  box-shadow:0 -2px 8px rgba(0,0,0,.08);
}

@media (max-width:560px){
  .bpmf{--rowhead:52px;--colmin:44px;}
  .bpmf .flash .q.zhuyin{font-size:74px;}
  .bpmf .vgrid{grid-template-columns:repeat(3,1fr);}
  .bpmf .gh{font-size:11px;padding:6px 3px;min-height:34px;}
  .bpmf .tile .z{font-size:19px;}
  .bpmf .tile .p{font-size:11px;}
  .bpmf .tile,.bpmf .void,.bpmf input.fc{min-height:48px;}
  .bpmf input.fc{font-size:16px;}
  /* pinbar: 1行目に文字・ピンイン・音声ボタン、2行目に説明を全幅表示 */
  .bpmf .pinbar{grid-template-columns:44px 1fr auto;grid-template-rows:auto auto;}
  .bpmf .pinbar .pbig{grid-column:1;grid-row:1;font-size:34px;align-self:center;}
  .bpmf .pinbar .ppinyin{grid-column:2;grid-row:1;font-size:14px;}
  .bpmf .pinbar .pspk{grid-column:3;grid-row:1;}
  .bpmf .pinbar .ptip{
    grid-column:1/-1;grid-row:2;
    font-size:13px;line-height:1.55;
    display:block;overflow:visible;
  }
}
@media (prefers-reduced-motion:reduce){
  .bpmf *{transition:none !important;}
}
`;

/* ───────────────────────────── helpers ───────────────────────────── */
const mannerClass = (m: string) => `m${MANNERS.indexOf(m)}`;

/* 台湾華語(zh-TW)優先で発音する。漢字を渡すことで正しい音にする。 */
function useSpeech(muted: boolean) {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const vs = window.speechSynthesis.getVoices();
      voiceRef.current =
        vs.find((v) => /zh[-_]TW/i.test(v.lang)) ||
        vs.find((v) => /zh[-_]HK/i.test(v.lang)) ||
        vs.find((v) => /^zh/i.test(v.lang)) ||
        null;
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (muted || !supported || !text) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = voiceRef.current ? voiceRef.current.lang : "zh-TW";
        if (voiceRef.current) u.voice = voiceRef.current;
        u.rate = 0.85;
        window.speechSynthesis.speak(u);
      } catch {
        /* 音声非対応でも学習は続行 */
      }
    },
    [muted, supported],
  );

  const speakZ = useCallback((zhuyin: string) => speak(SAY[zhuyin] ?? ""), [speak]);
  const speakText = useCallback((text: string) => speak(text), [speak]);

  return { speakZ, speakText, supported };
}

/* ───────────────────────────── 一覧 (Reference) ───────────────────────────── */
function Reference({ speakZ }: { speakZ: (z: string) => void }) {
  const [sel, setSel] = useState<Item | null>(null);
  const [section, setSection] = useState<"consonant" | "vowel">("consonant");

  const tap = (item: Item) => {
    setSel((prev) => (prev && prev.z === item.z ? null : item));
    speakZ(item.z);
  };

  const switchSection = (s: "consonant" | "vowel") => {
    setSection(s);
    setSel(null);
  };

  return (
    <>
      <div className="card">
        <div className="seg" role="tablist" aria-label="音の種類" style={{ marginBottom: 16 }}>
          <button
            role="tab"
            aria-selected={section === "consonant"}
            aria-pressed={section === "consonant"}
            onClick={() => switchSection("consonant")}
          >
            子音
          </button>
          <button
            role="tab"
            aria-selected={section === "vowel"}
            aria-pressed={section === "vowel"}
            onClick={() => switchSection("vowel")}
          >
            母音
          </button>
        </div>

        {section === "consonant" && (
          <>
            <p className="secttl">調音位置 × 調音方法</p>
            <div className="grid" style={{ "--mcount": MANNERS.length } as React.CSSProperties}>
              <div className="gh corner" />
              {MANNERS.map((m) => (
                <div key={m} className="gh" title={MANNER_TIPS[m]}>
                  {m}
                </div>
              ))}
              {PLACES.map((place) => (
                <React.Fragment key={place}>
                  <div className="gh rh" title={PLACE_TIPS[place]}>
                    {place}
                  </div>
                  {MANNERS.map((manner) => {
                    const c = byZ[`${place}|${manner}`];
                    if (!c)
                      return (
                        <div key={manner} className="void">
                          ·
                        </div>
                      );
                    const isSel = sel && sel.z === c.z;
                    return (
                      <button
                        key={manner}
                        className={`tile ${mannerClass(manner)} ${isSel ? "sel" : ""}`}
                        onClick={() => tap(c)}
                        aria-label={`${c.z} ${c.p} ${place} ${manner}`}
                      >
                        <span className="z">{c.z}</span>
                        <span className="p">{c.p}</span>
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </>
        )}

        {section === "vowel" && (
          <div className="vgrid">
            {["介音", "単母音", "複母音", "鼻母音", "そり舌母音"].map((g) => (
              <React.Fragment key={g}>
                <div className="vgroup">{g}</div>
                {VOWELS.filter((v) => v.group === g).map((v) => (
                  <button
                    key={v.z}
                    className="tile"
                    onClick={() => tap(v)}
                    aria-label={`${v.z} ${v.p}`}
                  >
                    <span className="z">{v.z}</span>
                    <span className="p">{v.p}</span>
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {sel && (
        <div className="pinbar">
          <div className="pbig">{sel.z}</div>
          <div className="ppinyin">
            ピンイン <b>{sel.p}</b>
          </div>
          <div className="ptip">
            {"place" in sel
              ? `${sel.place}：${PLACE_TIPS[sel.place]}　${sel.manner}：${MANNER_TIPS[sel.manner]}`
              : `${sel.group}：${VOWEL_TIPS[sel.z] || VOWEL_GROUP_TIPS[sel.group]}`}
          </div>
          <button className="pspk" onClick={() => speakZ(sel.z)} aria-label="もう一度再生">
            🔊
          </button>
        </div>
      )}
    </>
  );
}

/* ───────────────────────────── フラッシュカード ───────────────────────────── */
function Flashcards({
  mastered,
  markMastered,
  resetMastered,
  speakZ,
  speakText,
}: {
  mastered: Set<string>;
  markMastered: (z: string) => void;
  resetMastered: () => void;
  speakZ: (z: string) => void;
  speakText: (text: string) => void;
}) {
  const [dir, setDir] = useState("z2p"); // z2p | p2z | classify
  const [scope, setScope] = useState("consonant"); // consonant | vowel | all
  const [flipped, setFlipped] = useState(false);
  const [current, setCurrent] = useState<Item | null>(null);

  const reveal = () => {
    setFlipped((f) => {
      if (!f && current) speakZ(current.z);
      return !f;
    });
  };

  const pool = useMemo(() => {
    if (scope === "consonant") return CONSONANTS;
    if (scope === "vowel") return VOWELS;
    return ALL;
  }, [scope]);

  // 未習得カードのみランダム選出
  const pick = useCallback(
    (exclude?: string) => {
      const unmastered = pool.filter((item) => !mastered.has(item.z));
      if (unmastered.length === 0) return null;
      const candidates =
        exclude && unmastered.length > 1
          ? unmastered.filter((item) => item.z !== exclude)
          : unmastered;
      return candidates[Math.floor(Math.random() * candidates.length)];
    },
    [pool, mastered],
  );

  useEffect(() => {
    setCurrent(pick());
    setFlipped(false);
  }, [scope, dir]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = (currentZ?: string) => {
    setCurrent(pick(currentZ));
    setFlipped(false);
  };

  const grade = (ok: boolean) => {
    if (!current) return;
    if (ok) markMastered(current.z);
    next(current.z);
  };

  const unmasteredCount = pool.filter((item) => !mastered.has(item.z)).length;
  const masteredCount = pool.length - unmasteredCount;

  // 全習得済み
  if (unmasteredCount === 0) {
    return (
      <div className="card">
        <div className="controls">
          <div className="seg" role="group" aria-label="出題範囲">
            {[
              ["consonant", "子音"],
              ["vowel", "母音"],
              ["all", "すべて"],
            ].map(([v, l]) => (
              <button key={v} aria-pressed={scope === v} onClick={() => setScope(v)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="complete">
          <div className="big-check">🎉</div>
          <div className="msg">すべて習得しました！</div>
          <div className="sub">
            {pool.length} 音すべてに正答しました。リセットしてもう一度練習できます。
          </div>
          <button className="btn" onClick={resetMastered}>
            リセットして最初から
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;
  const isConsonant = "place" in current;
  const ex = EXAMPLE[current.z];

  // 表面・裏面の内容
  let front: string, frontKind: string, hint: string, back: React.ReactNode;
  if (dir === "z2p") {
    front = current.z;
    frontKind = "zhuyin";
    hint = "ピンインは？";
    back = (
      <div className="ans">
        <span className="pinyin">{current.p}</span>
      </div>
    );
  } else if (dir === "p2z") {
    front = current.p;
    frontKind = "text";
    hint = "注音符号は？";
    back = (
      <div className="ans">
        <span className="pinyin">{current.z}</span>
        {ex && (
          <div className="qword">
            <span className="ew">{ex.word}</span>
            <span className="ezy">
              {ex.zhuyin}　{ex.pinyin}
            </span>
            <span className="eg">{ex.gloss}</span>
            <button
              className="spk"
              onClick={(e) => {
                e.stopPropagation();
                speakText(ex.word);
              }}
              aria-label={`${ex.word}を再生`}
            >
              🔊 {ex.word}
            </button>
          </div>
        )}
      </div>
    );
  } else {
    front = current.z;
    frontKind = "zhuyin";
    hint = isConsonant ? "調音位置と方法は？" : "ピンイン（母音）は？";
    back = isConsonant ? (
      <div className="ans">
        {(current as Consonant).place} ／ {(current as Consonant).manner}
        <span className="pinyin" style={{ fontSize: 26, marginTop: 6 }}>
          {current.p}
        </span>
      </div>
    ) : (
      <div className="ans">
        {(current as Vowel).group}
        <span className="pinyin" style={{ fontSize: 26, marginTop: 6 }}>
          {current.p}
        </span>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="controls">
        <div className="seg" role="group" aria-label="出題範囲">
          {[
            ["consonant", "子音"],
            ["vowel", "母音"],
            ["all", "すべて"],
          ].map(([v, l]) => (
            <button key={v} aria-pressed={scope === v} onClick={() => setScope(v)}>
              {l}
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="出題形式">
          {[
            ["z2p", "注音→ピンイン"],
            ["p2z", "ピンイン→注音"],
            ["classify", "分類"],
          ].map(([v, l]) => (
            <button
              key={v}
              aria-pressed={dir === v}
              onClick={() => setDir(v)}
              disabled={v === "classify" && scope === "vowel"}
              style={v === "classify" && scope === "vowel" ? { opacity: 0.4 } : undefined}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div
        className="flash"
        role="button"
        tabIndex={0}
        onClick={reveal}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            reveal();
          }
        }}
        aria-label="カード。タップで答えを表示"
      >
        <div className={`q ${frontKind}`}>{front}</div>
        {frontKind === "zhuyin" && ex && (
          <div className="qword">
            <span className="ew">{ex.word}</span>
            {flipped && (
              <>
                <span className="ezy">
                  {ex.zhuyin}　{ex.pinyin}
                </span>
                <span className="eg">{ex.gloss}</span>
                <button
                  className="spk"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(ex.word);
                  }}
                  aria-label={`${ex.word}を再生`}
                >
                  🔊 {ex.word}
                </button>
              </>
            )}
          </div>
        )}
        {!flipped ? (
          <div className="hint">{hint}（タップで確認）</div>
        ) : (
          <>
            {back}
            <button
              className="spk"
              onClick={(e) => {
                e.stopPropagation();
                speakZ(current.z);
              }}
              aria-label="もう一度再生"
            >
              🔊 もう一度
            </button>
            {isConsonant ? (
              <div className="tipline">
                {PLACE_TIPS[(current as Consonant).place]}
                <br />
                {MANNER_TIPS[(current as Consonant).manner]}
              </div>
            ) : (
              <div className="tipline">
                {VOWEL_TIPS[current.z] || VOWEL_GROUP_TIPS[(current as Vowel).group]}
              </div>
            )}
          </>
        )}
      </div>

      {flipped && (
        <div className="grades">
          <button className="grade no" onClick={() => grade(false)}>
            × もう一度
          </button>
          <button className="grade yes" onClick={() => grade(true)}>
            ○ できた
          </button>
        </div>
      )}

      <div className="progress">
        <span className="pill g">
          習得済み {masteredCount} / {pool.length}
        </span>
        <span>残り {unmasteredCount} 音</span>
      </div>
    </div>
  );
}

/* ───────────────────────────── チャート埋め ───────────────────────────── */
function FillChart({ onCorrect }: { onCorrect: (z: string) => void }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const reset = () => {
    setVals({});
    setChecked(false);
  };

  const norm = (s: string | undefined) => (s || "").trim().toLowerCase();

  const check = () => {
    setChecked(true);
    CONSONANTS.forEach((c) => {
      if (norm(vals[c.z]) === c.p) onCorrect(c.z);
    });
  };

  const correctCount = CONSONANTS.filter((c) => norm(vals[c.z]) === c.p).length;
  const pct = Math.round((correctCount / CONSONANTS.length) * 100);

  return (
    <div className="card">
      <p className="secttl">空欄にピンインを入力 — 子音マトリクスを思い出す</p>
      <div className="fillgrid" style={{ "--mcount": MANNERS.length } as React.CSSProperties}>
        <div className="gh corner" />
        {MANNERS.map((m) => (
          <div key={m} className="gh">
            {m}
          </div>
        ))}
        {PLACES.map((place) => (
          <React.Fragment key={place}>
            <div className="gh rh">{place}</div>
            {MANNERS.map((manner) => {
              const c = byZ[`${place}|${manner}`];
              if (!c)
                return (
                  <div key={manner} className="void">
                    ·
                  </div>
                );
              const ok = norm(vals[c.z]) === c.p;
              return (
                <div className="gcell" key={manner}>
                  <input
                    className={`fc ${checked ? (ok ? "ok" : "ng") : ""}`}
                    value={vals[c.z] || ""}
                    placeholder={checked && !ok ? c.p : ""}
                    disabled={checked}
                    onChange={(e) => setVals((v) => ({ ...v, [c.z]: e.target.value }))}
                    aria-label={`${c.z} のピンイン`}
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <div className="fillzhuyin">{c.z}</div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="actions">
        {!checked ? (
          <button className="btn" onClick={check}>
            答え合わせ
          </button>
        ) : (
          <>
            <span className={`score ${pct === 100 ? "good" : pct >= 70 ? "mid" : ""}`}>
              {correctCount} / {CONSONANTS.length}（{pct}%）
            </span>
            <button className="btn ghost" onClick={reset}>
              もう一度
            </button>
          </>
        )}
      </div>
      {checked && pct < 100 && (
        <div
          className="bar"
          style={{
            height: 8,
            background: "var(--void)",
            borderRadius: 5,
            overflow: "hidden",
            marginTop: 14,
          }}
        >
          <span
            style={{
              display: "block",
              height: "100%",
              background: "var(--teal)",
              width: `${pct}%`,
              transition: "width .3s",
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── ルート ───────────────────────────── */
export default function BopomofoTrainer() {
  const [tab, setTab] = useState("ref");
  const [mastered, setMastered] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(false);
  const { speakZ, speakText, supported } = useSpeech(muted);

  useEffect(() => {
    void masteredStorage.load().then(setMastered);
  }, []);

  const markMastered = useCallback((z: string) => {
    setMastered((prev) => {
      const next = new Set(prev);
      next.add(z);
      void masteredStorage.save(next);
      return next;
    });
  }, []);

  const resetMastered = useCallback(() => {
    setMastered(new Set());
    void masteredStorage.clear();
  }, []);

  const resetAll = () => {
    if (!window.confirm("学習記録（習得済み）をすべて消去しますか？")) return;
    resetMastered();
  };

  return (
    <div className="bpmf">
      <style>{CSS}</style>
      <div className="wrap">
        <div className="head">
          <span className="mark">ㄅㄆㄇ</span>
          <h1>ボポモフォ暗記トレーナー</h1>
          {supported && (
            <button
              className="mute"
              onClick={() => setMuted((m) => !m)}
              aria-pressed={muted}
              aria-label={muted ? "音声をオンにする" : "音声をオフにする"}
              title={muted ? "音声オフ中" : "音声オン"}
            >
              {muted ? "🔇 音声オフ" : "🔊 音声オン"}
            </button>
          )}
        </div>
        <p className="lede">
          注音符号と発音のコツを覚えるためのアプリ。子音は「調音位置×調音方法」の表で、
          位置と方法のヒントから音を引き出せるように練習します。タイルやカードを押すと
          台湾華語（zh-TW）で発音が鳴ります。習得済み {mastered.size} / {ALL.length} 音。
        </p>
        {!supported && (
          <p className="lede" style={{ color: "var(--coral)" }}>
            ※
            このブラウザは音声合成に未対応のため、発音は再生されません（Safari/Chrome最新版を推奨）。
          </p>
        )}

        <div className="tabs" role="tablist">
          {[
            ["ref", "一覧"],
            ["cards", "フラッシュカード"],
            ["fill", "チャート埋め"],
          ].map(([v, l]) => (
            <button
              key={v}
              role="tab"
              aria-selected={tab === v}
              className="tab"
              onClick={() => setTab(v)}
            >
              {l}
            </button>
          ))}
        </div>

        <div style={tab !== "ref" ? { display: "none" } : undefined}>
          <Reference speakZ={speakZ} />
        </div>
        <div style={tab !== "cards" ? { display: "none" } : undefined}>
          <Flashcards
            mastered={mastered}
            markMastered={markMastered}
            resetMastered={resetMastered}
            speakZ={speakZ}
            speakText={speakText}
          />
        </div>
        <div style={tab !== "fill" ? { display: "none" } : undefined}>
          <FillChart onCorrect={markMastered} />
        </div>

        <p className="foot">
          出典：「ボポモフォと発音のコツ」（モーガンの台湾中国語講座 / Morgan Mandarin）
          <br />
          発音の音声は元動画チャンネルで確認できます。 ·{" "}
          <button className="reset" onClick={resetAll}>
            学習記録をリセット
          </button>
        </p>
      </div>
    </div>
  );
}
