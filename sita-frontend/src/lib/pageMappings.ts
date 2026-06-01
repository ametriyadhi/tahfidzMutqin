// Auto-generated page to surah-ayah mapping
export interface PageRangeMapping {
  surahId: number;
  startAyah: number;
  endAyah: number;
}

export const getPageForAyah = (surahId: number | string, ayahId: number | string): number => {
  const sId = Number(surahId);
  const aId = Number(ayahId);
  for (const [pageStr, ranges] of Object.entries(QURAN_PAGE_MAPPINGS)) {
    const page = parseInt(pageStr);
    for (const range of ranges) {
      if (range.surahId === sId && aId >= range.startAyah && aId <= range.endAyah) {
        return page;
      }
    }
  }
  return 1; // Fallback
};

export const QURAN_PAGE_MAPPINGS: Record<number, PageRangeMapping[]> = {
  "1": [
    {
      "surahId": 1,
      "startAyah": 1,
      "endAyah": 7
    }
  ],
  "2": [
    {
      "surahId": 2,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "3": [
    {
      "surahId": 2,
      "startAyah": 6,
      "endAyah": 16
    }
  ],
  "4": [
    {
      "surahId": 2,
      "startAyah": 17,
      "endAyah": 24
    }
  ],
  "5": [
    {
      "surahId": 2,
      "startAyah": 25,
      "endAyah": 29
    }
  ],
  "6": [
    {
      "surahId": 2,
      "startAyah": 30,
      "endAyah": 37
    }
  ],
  "7": [
    {
      "surahId": 2,
      "startAyah": 38,
      "endAyah": 48
    }
  ],
  "8": [
    {
      "surahId": 2,
      "startAyah": 49,
      "endAyah": 57
    }
  ],
  "9": [
    {
      "surahId": 2,
      "startAyah": 58,
      "endAyah": 61
    }
  ],
  "10": [
    {
      "surahId": 2,
      "startAyah": 62,
      "endAyah": 69
    }
  ],
  "11": [
    {
      "surahId": 2,
      "startAyah": 70,
      "endAyah": 76
    }
  ],
  "12": [
    {
      "surahId": 2,
      "startAyah": 77,
      "endAyah": 83
    }
  ],
  "13": [
    {
      "surahId": 2,
      "startAyah": 84,
      "endAyah": 88
    }
  ],
  "14": [
    {
      "surahId": 2,
      "startAyah": 89,
      "endAyah": 93
    }
  ],
  "15": [
    {
      "surahId": 2,
      "startAyah": 94,
      "endAyah": 101
    }
  ],
  "16": [
    {
      "surahId": 2,
      "startAyah": 102,
      "endAyah": 105
    }
  ],
  "17": [
    {
      "surahId": 2,
      "startAyah": 106,
      "endAyah": 112
    }
  ],
  "18": [
    {
      "surahId": 2,
      "startAyah": 113,
      "endAyah": 119
    }
  ],
  "19": [
    {
      "surahId": 2,
      "startAyah": 120,
      "endAyah": 126
    }
  ],
  "20": [
    {
      "surahId": 2,
      "startAyah": 127,
      "endAyah": 134
    }
  ],
  "21": [
    {
      "surahId": 2,
      "startAyah": 135,
      "endAyah": 141
    }
  ],
  "22": [
    {
      "surahId": 2,
      "startAyah": 142,
      "endAyah": 145
    }
  ],
  "23": [
    {
      "surahId": 2,
      "startAyah": 146,
      "endAyah": 153
    }
  ],
  "24": [
    {
      "surahId": 2,
      "startAyah": 154,
      "endAyah": 163
    }
  ],
  "25": [
    {
      "surahId": 2,
      "startAyah": 164,
      "endAyah": 169
    }
  ],
  "26": [
    {
      "surahId": 2,
      "startAyah": 170,
      "endAyah": 176
    }
  ],
  "27": [
    {
      "surahId": 2,
      "startAyah": 177,
      "endAyah": 181
    }
  ],
  "28": [
    {
      "surahId": 2,
      "startAyah": 182,
      "endAyah": 186
    }
  ],
  "29": [
    {
      "surahId": 2,
      "startAyah": 187,
      "endAyah": 190
    }
  ],
  "30": [
    {
      "surahId": 2,
      "startAyah": 191,
      "endAyah": 196
    }
  ],
  "31": [
    {
      "surahId": 2,
      "startAyah": 197,
      "endAyah": 202
    }
  ],
  "32": [
    {
      "surahId": 2,
      "startAyah": 203,
      "endAyah": 210
    }
  ],
  "33": [
    {
      "surahId": 2,
      "startAyah": 211,
      "endAyah": 215
    }
  ],
  "34": [
    {
      "surahId": 2,
      "startAyah": 216,
      "endAyah": 219
    }
  ],
  "35": [
    {
      "surahId": 2,
      "startAyah": 220,
      "endAyah": 224
    }
  ],
  "36": [
    {
      "surahId": 2,
      "startAyah": 225,
      "endAyah": 230
    }
  ],
  "37": [
    {
      "surahId": 2,
      "startAyah": 231,
      "endAyah": 233
    }
  ],
  "38": [
    {
      "surahId": 2,
      "startAyah": 234,
      "endAyah": 237
    }
  ],
  "39": [
    {
      "surahId": 2,
      "startAyah": 238,
      "endAyah": 245
    }
  ],
  "40": [
    {
      "surahId": 2,
      "startAyah": 246,
      "endAyah": 248
    }
  ],
  "41": [
    {
      "surahId": 2,
      "startAyah": 249,
      "endAyah": 252
    }
  ],
  "42": [
    {
      "surahId": 2,
      "startAyah": 253,
      "endAyah": 256
    }
  ],
  "43": [
    {
      "surahId": 2,
      "startAyah": 257,
      "endAyah": 259
    }
  ],
  "44": [
    {
      "surahId": 2,
      "startAyah": 260,
      "endAyah": 264
    }
  ],
  "45": [
    {
      "surahId": 2,
      "startAyah": 265,
      "endAyah": 269
    }
  ],
  "46": [
    {
      "surahId": 2,
      "startAyah": 270,
      "endAyah": 274
    }
  ],
  "47": [
    {
      "surahId": 2,
      "startAyah": 275,
      "endAyah": 281
    }
  ],
  "48": [
    {
      "surahId": 2,
      "startAyah": 282,
      "endAyah": 282
    }
  ],
  "49": [
    {
      "surahId": 2,
      "startAyah": 283,
      "endAyah": 286
    }
  ],
  "50": [
    {
      "surahId": 3,
      "startAyah": 1,
      "endAyah": 9
    }
  ],
  "51": [
    {
      "surahId": 3,
      "startAyah": 10,
      "endAyah": 15
    }
  ],
  "52": [
    {
      "surahId": 3,
      "startAyah": 16,
      "endAyah": 22
    }
  ],
  "53": [
    {
      "surahId": 3,
      "startAyah": 23,
      "endAyah": 29
    }
  ],
  "54": [
    {
      "surahId": 3,
      "startAyah": 30,
      "endAyah": 37
    }
  ],
  "55": [
    {
      "surahId": 3,
      "startAyah": 38,
      "endAyah": 45
    }
  ],
  "56": [
    {
      "surahId": 3,
      "startAyah": 46,
      "endAyah": 52
    }
  ],
  "57": [
    {
      "surahId": 3,
      "startAyah": 53,
      "endAyah": 61
    }
  ],
  "58": [
    {
      "surahId": 3,
      "startAyah": 62,
      "endAyah": 70
    }
  ],
  "59": [
    {
      "surahId": 3,
      "startAyah": 71,
      "endAyah": 77
    }
  ],
  "60": [
    {
      "surahId": 3,
      "startAyah": 78,
      "endAyah": 83
    }
  ],
  "61": [
    {
      "surahId": 3,
      "startAyah": 84,
      "endAyah": 91
    }
  ],
  "62": [
    {
      "surahId": 3,
      "startAyah": 92,
      "endAyah": 100
    }
  ],
  "63": [
    {
      "surahId": 3,
      "startAyah": 101,
      "endAyah": 108
    }
  ],
  "64": [
    {
      "surahId": 3,
      "startAyah": 109,
      "endAyah": 115
    }
  ],
  "65": [
    {
      "surahId": 3,
      "startAyah": 116,
      "endAyah": 121
    }
  ],
  "66": [
    {
      "surahId": 3,
      "startAyah": 122,
      "endAyah": 132
    }
  ],
  "67": [
    {
      "surahId": 3,
      "startAyah": 133,
      "endAyah": 140
    }
  ],
  "68": [
    {
      "surahId": 3,
      "startAyah": 141,
      "endAyah": 148
    }
  ],
  "69": [
    {
      "surahId": 3,
      "startAyah": 149,
      "endAyah": 153
    }
  ],
  "70": [
    {
      "surahId": 3,
      "startAyah": 154,
      "endAyah": 157
    }
  ],
  "71": [
    {
      "surahId": 3,
      "startAyah": 158,
      "endAyah": 165
    }
  ],
  "72": [
    {
      "surahId": 3,
      "startAyah": 166,
      "endAyah": 173
    }
  ],
  "73": [
    {
      "surahId": 3,
      "startAyah": 174,
      "endAyah": 180
    }
  ],
  "74": [
    {
      "surahId": 3,
      "startAyah": 181,
      "endAyah": 186
    }
  ],
  "75": [
    {
      "surahId": 3,
      "startAyah": 187,
      "endAyah": 194
    }
  ],
  "76": [
    {
      "surahId": 3,
      "startAyah": 195,
      "endAyah": 200
    }
  ],
  "77": [
    {
      "surahId": 4,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "78": [
    {
      "surahId": 4,
      "startAyah": 7,
      "endAyah": 11
    }
  ],
  "79": [
    {
      "surahId": 4,
      "startAyah": 12,
      "endAyah": 14
    }
  ],
  "80": [
    {
      "surahId": 4,
      "startAyah": 15,
      "endAyah": 19
    }
  ],
  "81": [
    {
      "surahId": 4,
      "startAyah": 20,
      "endAyah": 23
    }
  ],
  "82": [
    {
      "surahId": 4,
      "startAyah": 24,
      "endAyah": 26
    }
  ],
  "83": [
    {
      "surahId": 4,
      "startAyah": 27,
      "endAyah": 33
    }
  ],
  "84": [
    {
      "surahId": 4,
      "startAyah": 34,
      "endAyah": 37
    }
  ],
  "85": [
    {
      "surahId": 4,
      "startAyah": 38,
      "endAyah": 44
    }
  ],
  "86": [
    {
      "surahId": 4,
      "startAyah": 45,
      "endAyah": 51
    }
  ],
  "87": [
    {
      "surahId": 4,
      "startAyah": 52,
      "endAyah": 59
    }
  ],
  "88": [
    {
      "surahId": 4,
      "startAyah": 60,
      "endAyah": 65
    }
  ],
  "89": [
    {
      "surahId": 4,
      "startAyah": 66,
      "endAyah": 74
    }
  ],
  "90": [
    {
      "surahId": 4,
      "startAyah": 75,
      "endAyah": 79
    }
  ],
  "91": [
    {
      "surahId": 4,
      "startAyah": 80,
      "endAyah": 86
    }
  ],
  "92": [
    {
      "surahId": 4,
      "startAyah": 87,
      "endAyah": 91
    }
  ],
  "93": [
    {
      "surahId": 4,
      "startAyah": 92,
      "endAyah": 94
    }
  ],
  "94": [
    {
      "surahId": 4,
      "startAyah": 95,
      "endAyah": 101
    }
  ],
  "95": [
    {
      "surahId": 4,
      "startAyah": 102,
      "endAyah": 105
    }
  ],
  "96": [
    {
      "surahId": 4,
      "startAyah": 106,
      "endAyah": 113
    }
  ],
  "97": [
    {
      "surahId": 4,
      "startAyah": 114,
      "endAyah": 121
    }
  ],
  "98": [
    {
      "surahId": 4,
      "startAyah": 122,
      "endAyah": 127
    }
  ],
  "99": [
    {
      "surahId": 4,
      "startAyah": 128,
      "endAyah": 134
    }
  ],
  "100": [
    {
      "surahId": 4,
      "startAyah": 135,
      "endAyah": 140
    }
  ],
  "101": [
    {
      "surahId": 4,
      "startAyah": 141,
      "endAyah": 147
    }
  ],
  "102": [
    {
      "surahId": 4,
      "startAyah": 148,
      "endAyah": 154
    }
  ],
  "103": [
    {
      "surahId": 4,
      "startAyah": 155,
      "endAyah": 162
    }
  ],
  "104": [
    {
      "surahId": 4,
      "startAyah": 163,
      "endAyah": 170
    }
  ],
  "105": [
    {
      "surahId": 4,
      "startAyah": 171,
      "endAyah": 175
    }
  ],
  "106": [
    {
      "surahId": 4,
      "startAyah": 176,
      "endAyah": 176
    },
    {
      "surahId": 5,
      "startAyah": 1,
      "endAyah": 2
    }
  ],
  "107": [
    {
      "surahId": 5,
      "startAyah": 3,
      "endAyah": 5
    }
  ],
  "108": [
    {
      "surahId": 5,
      "startAyah": 6,
      "endAyah": 9
    }
  ],
  "109": [
    {
      "surahId": 5,
      "startAyah": 10,
      "endAyah": 13
    }
  ],
  "110": [
    {
      "surahId": 5,
      "startAyah": 14,
      "endAyah": 17
    }
  ],
  "111": [
    {
      "surahId": 5,
      "startAyah": 18,
      "endAyah": 23
    }
  ],
  "112": [
    {
      "surahId": 5,
      "startAyah": 24,
      "endAyah": 31
    }
  ],
  "113": [
    {
      "surahId": 5,
      "startAyah": 32,
      "endAyah": 36
    }
  ],
  "114": [
    {
      "surahId": 5,
      "startAyah": 37,
      "endAyah": 41
    }
  ],
  "115": [
    {
      "surahId": 5,
      "startAyah": 42,
      "endAyah": 45
    }
  ],
  "116": [
    {
      "surahId": 5,
      "startAyah": 46,
      "endAyah": 50
    }
  ],
  "117": [
    {
      "surahId": 5,
      "startAyah": 51,
      "endAyah": 57
    }
  ],
  "118": [
    {
      "surahId": 5,
      "startAyah": 58,
      "endAyah": 64
    }
  ],
  "119": [
    {
      "surahId": 5,
      "startAyah": 65,
      "endAyah": 70
    }
  ],
  "120": [
    {
      "surahId": 5,
      "startAyah": 71,
      "endAyah": 76
    }
  ],
  "121": [
    {
      "surahId": 5,
      "startAyah": 77,
      "endAyah": 82
    }
  ],
  "122": [
    {
      "surahId": 5,
      "startAyah": 83,
      "endAyah": 89
    }
  ],
  "123": [
    {
      "surahId": 5,
      "startAyah": 90,
      "endAyah": 95
    }
  ],
  "124": [
    {
      "surahId": 5,
      "startAyah": 96,
      "endAyah": 103
    }
  ],
  "125": [
    {
      "surahId": 5,
      "startAyah": 104,
      "endAyah": 108
    }
  ],
  "126": [
    {
      "surahId": 5,
      "startAyah": 109,
      "endAyah": 113
    }
  ],
  "127": [
    {
      "surahId": 5,
      "startAyah": 114,
      "endAyah": 120
    }
  ],
  "128": [
    {
      "surahId": 6,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "129": [
    {
      "surahId": 6,
      "startAyah": 9,
      "endAyah": 18
    }
  ],
  "130": [
    {
      "surahId": 6,
      "startAyah": 19,
      "endAyah": 27
    }
  ],
  "131": [
    {
      "surahId": 6,
      "startAyah": 28,
      "endAyah": 35
    }
  ],
  "132": [
    {
      "surahId": 6,
      "startAyah": 36,
      "endAyah": 44
    }
  ],
  "133": [
    {
      "surahId": 6,
      "startAyah": 45,
      "endAyah": 52
    }
  ],
  "134": [
    {
      "surahId": 6,
      "startAyah": 53,
      "endAyah": 59
    }
  ],
  "135": [
    {
      "surahId": 6,
      "startAyah": 60,
      "endAyah": 68
    }
  ],
  "136": [
    {
      "surahId": 6,
      "startAyah": 69,
      "endAyah": 73
    }
  ],
  "137": [
    {
      "surahId": 6,
      "startAyah": 74,
      "endAyah": 81
    }
  ],
  "138": [
    {
      "surahId": 6,
      "startAyah": 82,
      "endAyah": 90
    }
  ],
  "139": [
    {
      "surahId": 6,
      "startAyah": 91,
      "endAyah": 94
    }
  ],
  "140": [
    {
      "surahId": 6,
      "startAyah": 95,
      "endAyah": 101
    }
  ],
  "141": [
    {
      "surahId": 6,
      "startAyah": 102,
      "endAyah": 110
    }
  ],
  "142": [
    {
      "surahId": 6,
      "startAyah": 111,
      "endAyah": 118
    }
  ],
  "143": [
    {
      "surahId": 6,
      "startAyah": 119,
      "endAyah": 124
    }
  ],
  "144": [
    {
      "surahId": 6,
      "startAyah": 125,
      "endAyah": 131
    }
  ],
  "145": [
    {
      "surahId": 6,
      "startAyah": 132,
      "endAyah": 137
    }
  ],
  "146": [
    {
      "surahId": 6,
      "startAyah": 138,
      "endAyah": 142
    }
  ],
  "147": [
    {
      "surahId": 6,
      "startAyah": 143,
      "endAyah": 146
    }
  ],
  "148": [
    {
      "surahId": 6,
      "startAyah": 147,
      "endAyah": 151
    }
  ],
  "149": [
    {
      "surahId": 6,
      "startAyah": 152,
      "endAyah": 157
    }
  ],
  "150": [
    {
      "surahId": 6,
      "startAyah": 158,
      "endAyah": 165
    }
  ],
  "151": [
    {
      "surahId": 7,
      "startAyah": 1,
      "endAyah": 11
    }
  ],
  "152": [
    {
      "surahId": 7,
      "startAyah": 12,
      "endAyah": 22
    }
  ],
  "153": [
    {
      "surahId": 7,
      "startAyah": 23,
      "endAyah": 30
    }
  ],
  "154": [
    {
      "surahId": 7,
      "startAyah": 31,
      "endAyah": 37
    }
  ],
  "155": [
    {
      "surahId": 7,
      "startAyah": 38,
      "endAyah": 43
    }
  ],
  "156": [
    {
      "surahId": 7,
      "startAyah": 44,
      "endAyah": 51
    }
  ],
  "157": [
    {
      "surahId": 7,
      "startAyah": 52,
      "endAyah": 57
    }
  ],
  "158": [
    {
      "surahId": 7,
      "startAyah": 58,
      "endAyah": 67
    }
  ],
  "159": [
    {
      "surahId": 7,
      "startAyah": 68,
      "endAyah": 73
    }
  ],
  "160": [
    {
      "surahId": 7,
      "startAyah": 74,
      "endAyah": 81
    }
  ],
  "161": [
    {
      "surahId": 7,
      "startAyah": 82,
      "endAyah": 87
    }
  ],
  "162": [
    {
      "surahId": 7,
      "startAyah": 88,
      "endAyah": 95
    }
  ],
  "163": [
    {
      "surahId": 7,
      "startAyah": 96,
      "endAyah": 104
    }
  ],
  "164": [
    {
      "surahId": 7,
      "startAyah": 105,
      "endAyah": 120
    }
  ],
  "165": [
    {
      "surahId": 7,
      "startAyah": 121,
      "endAyah": 130
    }
  ],
  "166": [
    {
      "surahId": 7,
      "startAyah": 131,
      "endAyah": 137
    }
  ],
  "167": [
    {
      "surahId": 7,
      "startAyah": 138,
      "endAyah": 143
    }
  ],
  "168": [
    {
      "surahId": 7,
      "startAyah": 144,
      "endAyah": 149
    }
  ],
  "169": [
    {
      "surahId": 7,
      "startAyah": 150,
      "endAyah": 155
    }
  ],
  "170": [
    {
      "surahId": 7,
      "startAyah": 156,
      "endAyah": 159
    }
  ],
  "171": [
    {
      "surahId": 7,
      "startAyah": 160,
      "endAyah": 163
    }
  ],
  "172": [
    {
      "surahId": 7,
      "startAyah": 164,
      "endAyah": 170
    }
  ],
  "173": [
    {
      "surahId": 7,
      "startAyah": 171,
      "endAyah": 178
    }
  ],
  "174": [
    {
      "surahId": 7,
      "startAyah": 179,
      "endAyah": 187
    }
  ],
  "175": [
    {
      "surahId": 7,
      "startAyah": 188,
      "endAyah": 195
    }
  ],
  "176": [
    {
      "surahId": 7,
      "startAyah": 196,
      "endAyah": 206
    }
  ],
  "177": [
    {
      "surahId": 8,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "178": [
    {
      "surahId": 8,
      "startAyah": 9,
      "endAyah": 16
    }
  ],
  "179": [
    {
      "surahId": 8,
      "startAyah": 17,
      "endAyah": 25
    }
  ],
  "180": [
    {
      "surahId": 8,
      "startAyah": 26,
      "endAyah": 33
    }
  ],
  "181": [
    {
      "surahId": 8,
      "startAyah": 34,
      "endAyah": 40
    }
  ],
  "182": [
    {
      "surahId": 8,
      "startAyah": 41,
      "endAyah": 45
    }
  ],
  "183": [
    {
      "surahId": 8,
      "startAyah": 46,
      "endAyah": 52
    }
  ],
  "184": [
    {
      "surahId": 8,
      "startAyah": 53,
      "endAyah": 61
    }
  ],
  "185": [
    {
      "surahId": 8,
      "startAyah": 62,
      "endAyah": 69
    }
  ],
  "186": [
    {
      "surahId": 8,
      "startAyah": 70,
      "endAyah": 75
    }
  ],
  "187": [
    {
      "surahId": 9,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "188": [
    {
      "surahId": 9,
      "startAyah": 7,
      "endAyah": 13
    }
  ],
  "189": [
    {
      "surahId": 9,
      "startAyah": 14,
      "endAyah": 20
    }
  ],
  "190": [
    {
      "surahId": 9,
      "startAyah": 21,
      "endAyah": 26
    }
  ],
  "191": [
    {
      "surahId": 9,
      "startAyah": 27,
      "endAyah": 31
    }
  ],
  "192": [
    {
      "surahId": 9,
      "startAyah": 32,
      "endAyah": 36
    }
  ],
  "193": [
    {
      "surahId": 9,
      "startAyah": 37,
      "endAyah": 40
    }
  ],
  "194": [
    {
      "surahId": 9,
      "startAyah": 41,
      "endAyah": 47
    }
  ],
  "195": [
    {
      "surahId": 9,
      "startAyah": 48,
      "endAyah": 54
    }
  ],
  "196": [
    {
      "surahId": 9,
      "startAyah": 55,
      "endAyah": 61
    }
  ],
  "197": [
    {
      "surahId": 9,
      "startAyah": 62,
      "endAyah": 68
    }
  ],
  "198": [
    {
      "surahId": 9,
      "startAyah": 69,
      "endAyah": 72
    }
  ],
  "199": [
    {
      "surahId": 9,
      "startAyah": 73,
      "endAyah": 79
    }
  ],
  "200": [
    {
      "surahId": 9,
      "startAyah": 80,
      "endAyah": 86
    }
  ],
  "201": [
    {
      "surahId": 9,
      "startAyah": 87,
      "endAyah": 93
    }
  ],
  "202": [
    {
      "surahId": 9,
      "startAyah": 94,
      "endAyah": 99
    }
  ],
  "203": [
    {
      "surahId": 9,
      "startAyah": 100,
      "endAyah": 106
    }
  ],
  "204": [
    {
      "surahId": 9,
      "startAyah": 107,
      "endAyah": 111
    }
  ],
  "205": [
    {
      "surahId": 9,
      "startAyah": 112,
      "endAyah": 117
    }
  ],
  "206": [
    {
      "surahId": 9,
      "startAyah": 118,
      "endAyah": 122
    }
  ],
  "207": [
    {
      "surahId": 9,
      "startAyah": 123,
      "endAyah": 129
    }
  ],
  "208": [
    {
      "surahId": 10,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "209": [
    {
      "surahId": 10,
      "startAyah": 7,
      "endAyah": 14
    }
  ],
  "210": [
    {
      "surahId": 10,
      "startAyah": 15,
      "endAyah": 20
    }
  ],
  "211": [
    {
      "surahId": 10,
      "startAyah": 21,
      "endAyah": 25
    }
  ],
  "212": [
    {
      "surahId": 10,
      "startAyah": 26,
      "endAyah": 33
    }
  ],
  "213": [
    {
      "surahId": 10,
      "startAyah": 34,
      "endAyah": 42
    }
  ],
  "214": [
    {
      "surahId": 10,
      "startAyah": 43,
      "endAyah": 53
    }
  ],
  "215": [
    {
      "surahId": 10,
      "startAyah": 54,
      "endAyah": 61
    }
  ],
  "216": [
    {
      "surahId": 10,
      "startAyah": 62,
      "endAyah": 70
    }
  ],
  "217": [
    {
      "surahId": 10,
      "startAyah": 71,
      "endAyah": 78
    }
  ],
  "218": [
    {
      "surahId": 10,
      "startAyah": 79,
      "endAyah": 88
    }
  ],
  "219": [
    {
      "surahId": 10,
      "startAyah": 89,
      "endAyah": 97
    }
  ],
  "220": [
    {
      "surahId": 10,
      "startAyah": 98,
      "endAyah": 106
    }
  ],
  "221": [
    {
      "surahId": 10,
      "startAyah": 107,
      "endAyah": 109
    },
    {
      "surahId": 11,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "222": [
    {
      "surahId": 11,
      "startAyah": 6,
      "endAyah": 12
    }
  ],
  "223": [
    {
      "surahId": 11,
      "startAyah": 13,
      "endAyah": 19
    }
  ],
  "224": [
    {
      "surahId": 11,
      "startAyah": 20,
      "endAyah": 28
    }
  ],
  "225": [
    {
      "surahId": 11,
      "startAyah": 29,
      "endAyah": 37
    }
  ],
  "226": [
    {
      "surahId": 11,
      "startAyah": 38,
      "endAyah": 45
    }
  ],
  "227": [
    {
      "surahId": 11,
      "startAyah": 46,
      "endAyah": 53
    }
  ],
  "228": [
    {
      "surahId": 11,
      "startAyah": 54,
      "endAyah": 62
    }
  ],
  "229": [
    {
      "surahId": 11,
      "startAyah": 63,
      "endAyah": 71
    }
  ],
  "230": [
    {
      "surahId": 11,
      "startAyah": 72,
      "endAyah": 81
    }
  ],
  "231": [
    {
      "surahId": 11,
      "startAyah": 82,
      "endAyah": 88
    }
  ],
  "232": [
    {
      "surahId": 11,
      "startAyah": 89,
      "endAyah": 97
    }
  ],
  "233": [
    {
      "surahId": 11,
      "startAyah": 98,
      "endAyah": 108
    }
  ],
  "234": [
    {
      "surahId": 11,
      "startAyah": 109,
      "endAyah": 117
    }
  ],
  "235": [
    {
      "surahId": 11,
      "startAyah": 118,
      "endAyah": 123
    },
    {
      "surahId": 12,
      "startAyah": 1,
      "endAyah": 4
    }
  ],
  "236": [
    {
      "surahId": 12,
      "startAyah": 5,
      "endAyah": 14
    }
  ],
  "237": [
    {
      "surahId": 12,
      "startAyah": 15,
      "endAyah": 22
    }
  ],
  "238": [
    {
      "surahId": 12,
      "startAyah": 23,
      "endAyah": 30
    }
  ],
  "239": [
    {
      "surahId": 12,
      "startAyah": 31,
      "endAyah": 37
    }
  ],
  "240": [
    {
      "surahId": 12,
      "startAyah": 38,
      "endAyah": 43
    }
  ],
  "241": [
    {
      "surahId": 12,
      "startAyah": 44,
      "endAyah": 52
    }
  ],
  "242": [
    {
      "surahId": 12,
      "startAyah": 53,
      "endAyah": 63
    }
  ],
  "243": [
    {
      "surahId": 12,
      "startAyah": 64,
      "endAyah": 69
    }
  ],
  "244": [
    {
      "surahId": 12,
      "startAyah": 70,
      "endAyah": 78
    }
  ],
  "245": [
    {
      "surahId": 12,
      "startAyah": 79,
      "endAyah": 86
    }
  ],
  "246": [
    {
      "surahId": 12,
      "startAyah": 87,
      "endAyah": 95
    }
  ],
  "247": [
    {
      "surahId": 12,
      "startAyah": 96,
      "endAyah": 103
    }
  ],
  "248": [
    {
      "surahId": 12,
      "startAyah": 104,
      "endAyah": 111
    }
  ],
  "249": [
    {
      "surahId": 13,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "250": [
    {
      "surahId": 13,
      "startAyah": 6,
      "endAyah": 13
    }
  ],
  "251": [
    {
      "surahId": 13,
      "startAyah": 14,
      "endAyah": 18
    }
  ],
  "252": [
    {
      "surahId": 13,
      "startAyah": 19,
      "endAyah": 28
    }
  ],
  "253": [
    {
      "surahId": 13,
      "startAyah": 29,
      "endAyah": 34
    }
  ],
  "254": [
    {
      "surahId": 13,
      "startAyah": 35,
      "endAyah": 42
    }
  ],
  "255": [
    {
      "surahId": 13,
      "startAyah": 43,
      "endAyah": 43
    },
    {
      "surahId": 14,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "256": [
    {
      "surahId": 14,
      "startAyah": 6,
      "endAyah": 10
    }
  ],
  "257": [
    {
      "surahId": 14,
      "startAyah": 11,
      "endAyah": 18
    }
  ],
  "258": [
    {
      "surahId": 14,
      "startAyah": 19,
      "endAyah": 24
    }
  ],
  "259": [
    {
      "surahId": 14,
      "startAyah": 25,
      "endAyah": 33
    }
  ],
  "260": [
    {
      "surahId": 14,
      "startAyah": 34,
      "endAyah": 42
    }
  ],
  "261": [
    {
      "surahId": 14,
      "startAyah": 43,
      "endAyah": 52
    }
  ],
  "262": [
    {
      "surahId": 15,
      "startAyah": 1,
      "endAyah": 15
    }
  ],
  "263": [
    {
      "surahId": 15,
      "startAyah": 16,
      "endAyah": 31
    }
  ],
  "264": [
    {
      "surahId": 15,
      "startAyah": 32,
      "endAyah": 51
    }
  ],
  "265": [
    {
      "surahId": 15,
      "startAyah": 52,
      "endAyah": 70
    }
  ],
  "266": [
    {
      "surahId": 15,
      "startAyah": 71,
      "endAyah": 90
    }
  ],
  "267": [
    {
      "surahId": 15,
      "startAyah": 91,
      "endAyah": 99
    },
    {
      "surahId": 16,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "268": [
    {
      "surahId": 16,
      "startAyah": 7,
      "endAyah": 14
    }
  ],
  "269": [
    {
      "surahId": 16,
      "startAyah": 15,
      "endAyah": 26
    }
  ],
  "270": [
    {
      "surahId": 16,
      "startAyah": 27,
      "endAyah": 34
    }
  ],
  "271": [
    {
      "surahId": 16,
      "startAyah": 35,
      "endAyah": 42
    }
  ],
  "272": [
    {
      "surahId": 16,
      "startAyah": 43,
      "endAyah": 54
    }
  ],
  "273": [
    {
      "surahId": 16,
      "startAyah": 55,
      "endAyah": 64
    }
  ],
  "274": [
    {
      "surahId": 16,
      "startAyah": 65,
      "endAyah": 72
    }
  ],
  "275": [
    {
      "surahId": 16,
      "startAyah": 73,
      "endAyah": 79
    }
  ],
  "276": [
    {
      "surahId": 16,
      "startAyah": 80,
      "endAyah": 87
    }
  ],
  "277": [
    {
      "surahId": 16,
      "startAyah": 88,
      "endAyah": 93
    }
  ],
  "278": [
    {
      "surahId": 16,
      "startAyah": 94,
      "endAyah": 102
    }
  ],
  "279": [
    {
      "surahId": 16,
      "startAyah": 103,
      "endAyah": 110
    }
  ],
  "280": [
    {
      "surahId": 16,
      "startAyah": 111,
      "endAyah": 118
    }
  ],
  "281": [
    {
      "surahId": 16,
      "startAyah": 119,
      "endAyah": 128
    }
  ],
  "282": [
    {
      "surahId": 17,
      "startAyah": 1,
      "endAyah": 7
    }
  ],
  "283": [
    {
      "surahId": 17,
      "startAyah": 8,
      "endAyah": 17
    }
  ],
  "284": [
    {
      "surahId": 17,
      "startAyah": 18,
      "endAyah": 27
    }
  ],
  "285": [
    {
      "surahId": 17,
      "startAyah": 28,
      "endAyah": 38
    }
  ],
  "286": [
    {
      "surahId": 17,
      "startAyah": 39,
      "endAyah": 49
    }
  ],
  "287": [
    {
      "surahId": 17,
      "startAyah": 50,
      "endAyah": 58
    }
  ],
  "288": [
    {
      "surahId": 17,
      "startAyah": 59,
      "endAyah": 66
    }
  ],
  "289": [
    {
      "surahId": 17,
      "startAyah": 67,
      "endAyah": 75
    }
  ],
  "290": [
    {
      "surahId": 17,
      "startAyah": 76,
      "endAyah": 86
    }
  ],
  "291": [
    {
      "surahId": 17,
      "startAyah": 87,
      "endAyah": 96
    }
  ],
  "292": [
    {
      "surahId": 17,
      "startAyah": 97,
      "endAyah": 104
    }
  ],
  "293": [
    {
      "surahId": 17,
      "startAyah": 105,
      "endAyah": 111
    },
    {
      "surahId": 18,
      "startAyah": 1,
      "endAyah": 4
    }
  ],
  "294": [
    {
      "surahId": 18,
      "startAyah": 5,
      "endAyah": 15
    }
  ],
  "295": [
    {
      "surahId": 18,
      "startAyah": 16,
      "endAyah": 20
    }
  ],
  "296": [
    {
      "surahId": 18,
      "startAyah": 21,
      "endAyah": 27
    }
  ],
  "297": [
    {
      "surahId": 18,
      "startAyah": 28,
      "endAyah": 34
    }
  ],
  "298": [
    {
      "surahId": 18,
      "startAyah": 35,
      "endAyah": 45
    }
  ],
  "299": [
    {
      "surahId": 18,
      "startAyah": 46,
      "endAyah": 53
    }
  ],
  "300": [
    {
      "surahId": 18,
      "startAyah": 54,
      "endAyah": 61
    }
  ],
  "301": [
    {
      "surahId": 18,
      "startAyah": 62,
      "endAyah": 74
    }
  ],
  "302": [
    {
      "surahId": 18,
      "startAyah": 75,
      "endAyah": 83
    }
  ],
  "303": [
    {
      "surahId": 18,
      "startAyah": 84,
      "endAyah": 97
    }
  ],
  "304": [
    {
      "surahId": 18,
      "startAyah": 98,
      "endAyah": 110
    }
  ],
  "305": [
    {
      "surahId": 19,
      "startAyah": 1,
      "endAyah": 11
    }
  ],
  "306": [
    {
      "surahId": 19,
      "startAyah": 12,
      "endAyah": 25
    }
  ],
  "307": [
    {
      "surahId": 19,
      "startAyah": 26,
      "endAyah": 38
    }
  ],
  "308": [
    {
      "surahId": 19,
      "startAyah": 39,
      "endAyah": 51
    }
  ],
  "309": [
    {
      "surahId": 19,
      "startAyah": 52,
      "endAyah": 64
    }
  ],
  "310": [
    {
      "surahId": 19,
      "startAyah": 65,
      "endAyah": 76
    }
  ],
  "311": [
    {
      "surahId": 19,
      "startAyah": 77,
      "endAyah": 95
    }
  ],
  "312": [
    {
      "surahId": 19,
      "startAyah": 96,
      "endAyah": 98
    },
    {
      "surahId": 20,
      "startAyah": 1,
      "endAyah": 12
    }
  ],
  "313": [
    {
      "surahId": 20,
      "startAyah": 13,
      "endAyah": 37
    }
  ],
  "314": [
    {
      "surahId": 20,
      "startAyah": 38,
      "endAyah": 51
    }
  ],
  "315": [
    {
      "surahId": 20,
      "startAyah": 52,
      "endAyah": 64
    }
  ],
  "316": [
    {
      "surahId": 20,
      "startAyah": 65,
      "endAyah": 76
    }
  ],
  "317": [
    {
      "surahId": 20,
      "startAyah": 77,
      "endAyah": 87
    }
  ],
  "318": [
    {
      "surahId": 20,
      "startAyah": 88,
      "endAyah": 98
    }
  ],
  "319": [
    {
      "surahId": 20,
      "startAyah": 99,
      "endAyah": 113
    }
  ],
  "320": [
    {
      "surahId": 20,
      "startAyah": 114,
      "endAyah": 125
    }
  ],
  "321": [
    {
      "surahId": 20,
      "startAyah": 126,
      "endAyah": 135
    }
  ],
  "322": [
    {
      "surahId": 21,
      "startAyah": 1,
      "endAyah": 10
    }
  ],
  "323": [
    {
      "surahId": 21,
      "startAyah": 11,
      "endAyah": 24
    }
  ],
  "324": [
    {
      "surahId": 21,
      "startAyah": 25,
      "endAyah": 35
    }
  ],
  "325": [
    {
      "surahId": 21,
      "startAyah": 36,
      "endAyah": 44
    }
  ],
  "326": [
    {
      "surahId": 21,
      "startAyah": 45,
      "endAyah": 57
    }
  ],
  "327": [
    {
      "surahId": 21,
      "startAyah": 58,
      "endAyah": 72
    }
  ],
  "328": [
    {
      "surahId": 21,
      "startAyah": 73,
      "endAyah": 81
    }
  ],
  "329": [
    {
      "surahId": 21,
      "startAyah": 82,
      "endAyah": 90
    }
  ],
  "330": [
    {
      "surahId": 21,
      "startAyah": 91,
      "endAyah": 101
    }
  ],
  "331": [
    {
      "surahId": 21,
      "startAyah": 102,
      "endAyah": 112
    }
  ],
  "332": [
    {
      "surahId": 22,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "333": [
    {
      "surahId": 22,
      "startAyah": 6,
      "endAyah": 15
    }
  ],
  "334": [
    {
      "surahId": 22,
      "startAyah": 16,
      "endAyah": 23
    }
  ],
  "335": [
    {
      "surahId": 22,
      "startAyah": 24,
      "endAyah": 30
    }
  ],
  "336": [
    {
      "surahId": 22,
      "startAyah": 31,
      "endAyah": 38
    }
  ],
  "337": [
    {
      "surahId": 22,
      "startAyah": 39,
      "endAyah": 46
    }
  ],
  "338": [
    {
      "surahId": 22,
      "startAyah": 47,
      "endAyah": 55
    }
  ],
  "339": [
    {
      "surahId": 22,
      "startAyah": 56,
      "endAyah": 64
    }
  ],
  "340": [
    {
      "surahId": 22,
      "startAyah": 65,
      "endAyah": 72
    }
  ],
  "341": [
    {
      "surahId": 22,
      "startAyah": 73,
      "endAyah": 78
    }
  ],
  "342": [
    {
      "surahId": 23,
      "startAyah": 1,
      "endAyah": 17
    }
  ],
  "343": [
    {
      "surahId": 23,
      "startAyah": 18,
      "endAyah": 27
    }
  ],
  "344": [
    {
      "surahId": 23,
      "startAyah": 28,
      "endAyah": 42
    }
  ],
  "345": [
    {
      "surahId": 23,
      "startAyah": 43,
      "endAyah": 59
    }
  ],
  "346": [
    {
      "surahId": 23,
      "startAyah": 60,
      "endAyah": 74
    }
  ],
  "347": [
    {
      "surahId": 23,
      "startAyah": 75,
      "endAyah": 89
    }
  ],
  "348": [
    {
      "surahId": 23,
      "startAyah": 90,
      "endAyah": 104
    }
  ],
  "349": [
    {
      "surahId": 23,
      "startAyah": 105,
      "endAyah": 118
    }
  ],
  "350": [
    {
      "surahId": 24,
      "startAyah": 1,
      "endAyah": 10
    }
  ],
  "351": [
    {
      "surahId": 24,
      "startAyah": 11,
      "endAyah": 20
    }
  ],
  "352": [
    {
      "surahId": 24,
      "startAyah": 21,
      "endAyah": 27
    }
  ],
  "353": [
    {
      "surahId": 24,
      "startAyah": 28,
      "endAyah": 31
    }
  ],
  "354": [
    {
      "surahId": 24,
      "startAyah": 32,
      "endAyah": 36
    }
  ],
  "355": [
    {
      "surahId": 24,
      "startAyah": 37,
      "endAyah": 43
    }
  ],
  "356": [
    {
      "surahId": 24,
      "startAyah": 44,
      "endAyah": 53
    }
  ],
  "357": [
    {
      "surahId": 24,
      "startAyah": 54,
      "endAyah": 58
    }
  ],
  "358": [
    {
      "surahId": 24,
      "startAyah": 59,
      "endAyah": 61
    }
  ],
  "359": [
    {
      "surahId": 24,
      "startAyah": 62,
      "endAyah": 64
    },
    {
      "surahId": 25,
      "startAyah": 1,
      "endAyah": 2
    }
  ],
  "360": [
    {
      "surahId": 25,
      "startAyah": 3,
      "endAyah": 11
    }
  ],
  "361": [
    {
      "surahId": 25,
      "startAyah": 12,
      "endAyah": 20
    }
  ],
  "362": [
    {
      "surahId": 25,
      "startAyah": 21,
      "endAyah": 32
    }
  ],
  "363": [
    {
      "surahId": 25,
      "startAyah": 33,
      "endAyah": 43
    }
  ],
  "364": [
    {
      "surahId": 25,
      "startAyah": 44,
      "endAyah": 55
    }
  ],
  "365": [
    {
      "surahId": 25,
      "startAyah": 56,
      "endAyah": 67
    }
  ],
  "366": [
    {
      "surahId": 25,
      "startAyah": 68,
      "endAyah": 77
    }
  ],
  "367": [
    {
      "surahId": 26,
      "startAyah": 1,
      "endAyah": 19
    }
  ],
  "368": [
    {
      "surahId": 26,
      "startAyah": 20,
      "endAyah": 39
    }
  ],
  "369": [
    {
      "surahId": 26,
      "startAyah": 40,
      "endAyah": 60
    }
  ],
  "370": [
    {
      "surahId": 26,
      "startAyah": 61,
      "endAyah": 83
    }
  ],
  "371": [
    {
      "surahId": 26,
      "startAyah": 84,
      "endAyah": 111
    }
  ],
  "372": [
    {
      "surahId": 26,
      "startAyah": 112,
      "endAyah": 136
    }
  ],
  "373": [
    {
      "surahId": 26,
      "startAyah": 137,
      "endAyah": 159
    }
  ],
  "374": [
    {
      "surahId": 26,
      "startAyah": 160,
      "endAyah": 183
    }
  ],
  "375": [
    {
      "surahId": 26,
      "startAyah": 184,
      "endAyah": 206
    }
  ],
  "376": [
    {
      "surahId": 26,
      "startAyah": 207,
      "endAyah": 227
    }
  ],
  "377": [
    {
      "surahId": 27,
      "startAyah": 1,
      "endAyah": 13
    }
  ],
  "378": [
    {
      "surahId": 27,
      "startAyah": 14,
      "endAyah": 22
    }
  ],
  "379": [
    {
      "surahId": 27,
      "startAyah": 23,
      "endAyah": 35
    }
  ],
  "380": [
    {
      "surahId": 27,
      "startAyah": 36,
      "endAyah": 44
    }
  ],
  "381": [
    {
      "surahId": 27,
      "startAyah": 45,
      "endAyah": 55
    }
  ],
  "382": [
    {
      "surahId": 27,
      "startAyah": 56,
      "endAyah": 63
    }
  ],
  "383": [
    {
      "surahId": 27,
      "startAyah": 64,
      "endAyah": 76
    }
  ],
  "384": [
    {
      "surahId": 27,
      "startAyah": 77,
      "endAyah": 88
    }
  ],
  "385": [
    {
      "surahId": 27,
      "startAyah": 89,
      "endAyah": 93
    },
    {
      "surahId": 28,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "386": [
    {
      "surahId": 28,
      "startAyah": 6,
      "endAyah": 13
    }
  ],
  "387": [
    {
      "surahId": 28,
      "startAyah": 14,
      "endAyah": 21
    }
  ],
  "388": [
    {
      "surahId": 28,
      "startAyah": 22,
      "endAyah": 28
    }
  ],
  "389": [
    {
      "surahId": 28,
      "startAyah": 29,
      "endAyah": 35
    }
  ],
  "390": [
    {
      "surahId": 28,
      "startAyah": 36,
      "endAyah": 43
    }
  ],
  "391": [
    {
      "surahId": 28,
      "startAyah": 44,
      "endAyah": 50
    }
  ],
  "392": [
    {
      "surahId": 28,
      "startAyah": 51,
      "endAyah": 59
    }
  ],
  "393": [
    {
      "surahId": 28,
      "startAyah": 60,
      "endAyah": 70
    }
  ],
  "394": [
    {
      "surahId": 28,
      "startAyah": 71,
      "endAyah": 77
    }
  ],
  "395": [
    {
      "surahId": 28,
      "startAyah": 78,
      "endAyah": 84
    }
  ],
  "396": [
    {
      "surahId": 28,
      "startAyah": 85,
      "endAyah": 88
    },
    {
      "surahId": 29,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "397": [
    {
      "surahId": 29,
      "startAyah": 7,
      "endAyah": 14
    }
  ],
  "398": [
    {
      "surahId": 29,
      "startAyah": 15,
      "endAyah": 23
    }
  ],
  "399": [
    {
      "surahId": 29,
      "startAyah": 24,
      "endAyah": 30
    }
  ],
  "400": [
    {
      "surahId": 29,
      "startAyah": 31,
      "endAyah": 38
    }
  ],
  "401": [
    {
      "surahId": 29,
      "startAyah": 39,
      "endAyah": 45
    }
  ],
  "402": [
    {
      "surahId": 29,
      "startAyah": 46,
      "endAyah": 52
    }
  ],
  "403": [
    {
      "surahId": 29,
      "startAyah": 53,
      "endAyah": 63
    }
  ],
  "404": [
    {
      "surahId": 29,
      "startAyah": 64,
      "endAyah": 69
    },
    {
      "surahId": 30,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "405": [
    {
      "surahId": 30,
      "startAyah": 6,
      "endAyah": 15
    }
  ],
  "406": [
    {
      "surahId": 30,
      "startAyah": 16,
      "endAyah": 24
    }
  ],
  "407": [
    {
      "surahId": 30,
      "startAyah": 25,
      "endAyah": 32
    }
  ],
  "408": [
    {
      "surahId": 30,
      "startAyah": 33,
      "endAyah": 41
    }
  ],
  "409": [
    {
      "surahId": 30,
      "startAyah": 42,
      "endAyah": 50
    }
  ],
  "410": [
    {
      "surahId": 30,
      "startAyah": 51,
      "endAyah": 60
    }
  ],
  "411": [
    {
      "surahId": 31,
      "startAyah": 1,
      "endAyah": 11
    }
  ],
  "412": [
    {
      "surahId": 31,
      "startAyah": 12,
      "endAyah": 19
    }
  ],
  "413": [
    {
      "surahId": 31,
      "startAyah": 20,
      "endAyah": 28
    }
  ],
  "414": [
    {
      "surahId": 31,
      "startAyah": 29,
      "endAyah": 34
    }
  ],
  "415": [
    {
      "surahId": 32,
      "startAyah": 1,
      "endAyah": 11
    }
  ],
  "416": [
    {
      "surahId": 32,
      "startAyah": 12,
      "endAyah": 20
    }
  ],
  "417": [
    {
      "surahId": 32,
      "startAyah": 21,
      "endAyah": 30
    }
  ],
  "418": [
    {
      "surahId": 33,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "419": [
    {
      "surahId": 33,
      "startAyah": 7,
      "endAyah": 15
    }
  ],
  "420": [
    {
      "surahId": 33,
      "startAyah": 16,
      "endAyah": 22
    }
  ],
  "421": [
    {
      "surahId": 33,
      "startAyah": 23,
      "endAyah": 30
    }
  ],
  "422": [
    {
      "surahId": 33,
      "startAyah": 31,
      "endAyah": 35
    }
  ],
  "423": [
    {
      "surahId": 33,
      "startAyah": 36,
      "endAyah": 43
    }
  ],
  "424": [
    {
      "surahId": 33,
      "startAyah": 44,
      "endAyah": 50
    }
  ],
  "425": [
    {
      "surahId": 33,
      "startAyah": 51,
      "endAyah": 54
    }
  ],
  "426": [
    {
      "surahId": 33,
      "startAyah": 55,
      "endAyah": 62
    }
  ],
  "427": [
    {
      "surahId": 33,
      "startAyah": 63,
      "endAyah": 73
    }
  ],
  "428": [
    {
      "surahId": 34,
      "startAyah": 1,
      "endAyah": 7
    }
  ],
  "429": [
    {
      "surahId": 34,
      "startAyah": 8,
      "endAyah": 14
    }
  ],
  "430": [
    {
      "surahId": 34,
      "startAyah": 15,
      "endAyah": 22
    }
  ],
  "431": [
    {
      "surahId": 34,
      "startAyah": 23,
      "endAyah": 31
    }
  ],
  "432": [
    {
      "surahId": 34,
      "startAyah": 32,
      "endAyah": 39
    }
  ],
  "433": [
    {
      "surahId": 34,
      "startAyah": 40,
      "endAyah": 48
    }
  ],
  "434": [
    {
      "surahId": 34,
      "startAyah": 49,
      "endAyah": 54
    },
    {
      "surahId": 35,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "435": [
    {
      "surahId": 35,
      "startAyah": 4,
      "endAyah": 11
    }
  ],
  "436": [
    {
      "surahId": 35,
      "startAyah": 12,
      "endAyah": 18
    }
  ],
  "437": [
    {
      "surahId": 35,
      "startAyah": 19,
      "endAyah": 30
    }
  ],
  "438": [
    {
      "surahId": 35,
      "startAyah": 31,
      "endAyah": 38
    }
  ],
  "439": [
    {
      "surahId": 35,
      "startAyah": 39,
      "endAyah": 44
    }
  ],
  "440": [
    {
      "surahId": 35,
      "startAyah": 45,
      "endAyah": 45
    },
    {
      "surahId": 36,
      "startAyah": 1,
      "endAyah": 12
    }
  ],
  "441": [
    {
      "surahId": 36,
      "startAyah": 13,
      "endAyah": 27
    }
  ],
  "442": [
    {
      "surahId": 36,
      "startAyah": 28,
      "endAyah": 40
    }
  ],
  "443": [
    {
      "surahId": 36,
      "startAyah": 41,
      "endAyah": 54
    }
  ],
  "444": [
    {
      "surahId": 36,
      "startAyah": 55,
      "endAyah": 70
    }
  ],
  "445": [
    {
      "surahId": 36,
      "startAyah": 71,
      "endAyah": 83
    }
  ],
  "446": [
    {
      "surahId": 37,
      "startAyah": 1,
      "endAyah": 24
    }
  ],
  "447": [
    {
      "surahId": 37,
      "startAyah": 25,
      "endAyah": 51
    }
  ],
  "448": [
    {
      "surahId": 37,
      "startAyah": 52,
      "endAyah": 76
    }
  ],
  "449": [
    {
      "surahId": 37,
      "startAyah": 77,
      "endAyah": 102
    }
  ],
  "450": [
    {
      "surahId": 37,
      "startAyah": 103,
      "endAyah": 126
    }
  ],
  "451": [
    {
      "surahId": 37,
      "startAyah": 127,
      "endAyah": 153
    }
  ],
  "452": [
    {
      "surahId": 37,
      "startAyah": 154,
      "endAyah": 182
    }
  ],
  "453": [
    {
      "surahId": 38,
      "startAyah": 1,
      "endAyah": 16
    }
  ],
  "454": [
    {
      "surahId": 38,
      "startAyah": 17,
      "endAyah": 26
    }
  ],
  "455": [
    {
      "surahId": 38,
      "startAyah": 27,
      "endAyah": 42
    }
  ],
  "456": [
    {
      "surahId": 38,
      "startAyah": 43,
      "endAyah": 61
    }
  ],
  "457": [
    {
      "surahId": 38,
      "startAyah": 62,
      "endAyah": 83
    }
  ],
  "458": [
    {
      "surahId": 38,
      "startAyah": 84,
      "endAyah": 88
    },
    {
      "surahId": 39,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "459": [
    {
      "surahId": 39,
      "startAyah": 6,
      "endAyah": 10
    }
  ],
  "460": [
    {
      "surahId": 39,
      "startAyah": 11,
      "endAyah": 21
    }
  ],
  "461": [
    {
      "surahId": 39,
      "startAyah": 22,
      "endAyah": 31
    }
  ],
  "462": [
    {
      "surahId": 39,
      "startAyah": 32,
      "endAyah": 40
    }
  ],
  "463": [
    {
      "surahId": 39,
      "startAyah": 41,
      "endAyah": 47
    }
  ],
  "464": [
    {
      "surahId": 39,
      "startAyah": 48,
      "endAyah": 56
    }
  ],
  "465": [
    {
      "surahId": 39,
      "startAyah": 57,
      "endAyah": 67
    }
  ],
  "466": [
    {
      "surahId": 39,
      "startAyah": 68,
      "endAyah": 74
    }
  ],
  "467": [
    {
      "surahId": 39,
      "startAyah": 75,
      "endAyah": 75
    },
    {
      "surahId": 40,
      "startAyah": 1,
      "endAyah": 7
    }
  ],
  "468": [
    {
      "surahId": 40,
      "startAyah": 8,
      "endAyah": 16
    }
  ],
  "469": [
    {
      "surahId": 40,
      "startAyah": 17,
      "endAyah": 25
    }
  ],
  "470": [
    {
      "surahId": 40,
      "startAyah": 26,
      "endAyah": 33
    }
  ],
  "471": [
    {
      "surahId": 40,
      "startAyah": 34,
      "endAyah": 40
    }
  ],
  "472": [
    {
      "surahId": 40,
      "startAyah": 41,
      "endAyah": 49
    }
  ],
  "473": [
    {
      "surahId": 40,
      "startAyah": 50,
      "endAyah": 58
    }
  ],
  "474": [
    {
      "surahId": 40,
      "startAyah": 59,
      "endAyah": 66
    }
  ],
  "475": [
    {
      "surahId": 40,
      "startAyah": 67,
      "endAyah": 77
    }
  ],
  "476": [
    {
      "surahId": 40,
      "startAyah": 78,
      "endAyah": 85
    }
  ],
  "477": [
    {
      "surahId": 41,
      "startAyah": 1,
      "endAyah": 11
    }
  ],
  "478": [
    {
      "surahId": 41,
      "startAyah": 12,
      "endAyah": 20
    }
  ],
  "479": [
    {
      "surahId": 41,
      "startAyah": 21,
      "endAyah": 29
    }
  ],
  "480": [
    {
      "surahId": 41,
      "startAyah": 30,
      "endAyah": 38
    }
  ],
  "481": [
    {
      "surahId": 41,
      "startAyah": 39,
      "endAyah": 46
    }
  ],
  "482": [
    {
      "surahId": 41,
      "startAyah": 47,
      "endAyah": 54
    }
  ],
  "483": [
    {
      "surahId": 42,
      "startAyah": 1,
      "endAyah": 10
    }
  ],
  "484": [
    {
      "surahId": 42,
      "startAyah": 11,
      "endAyah": 15
    }
  ],
  "485": [
    {
      "surahId": 42,
      "startAyah": 16,
      "endAyah": 22
    }
  ],
  "486": [
    {
      "surahId": 42,
      "startAyah": 23,
      "endAyah": 31
    }
  ],
  "487": [
    {
      "surahId": 42,
      "startAyah": 32,
      "endAyah": 44
    }
  ],
  "488": [
    {
      "surahId": 42,
      "startAyah": 45,
      "endAyah": 51
    }
  ],
  "489": [
    {
      "surahId": 42,
      "startAyah": 52,
      "endAyah": 53
    },
    {
      "surahId": 43,
      "startAyah": 1,
      "endAyah": 10
    }
  ],
  "490": [
    {
      "surahId": 43,
      "startAyah": 11,
      "endAyah": 22
    }
  ],
  "491": [
    {
      "surahId": 43,
      "startAyah": 23,
      "endAyah": 33
    }
  ],
  "492": [
    {
      "surahId": 43,
      "startAyah": 34,
      "endAyah": 47
    }
  ],
  "493": [
    {
      "surahId": 43,
      "startAyah": 48,
      "endAyah": 60
    }
  ],
  "494": [
    {
      "surahId": 43,
      "startAyah": 61,
      "endAyah": 73
    }
  ],
  "495": [
    {
      "surahId": 43,
      "startAyah": 74,
      "endAyah": 89
    }
  ],
  "496": [
    {
      "surahId": 44,
      "startAyah": 1,
      "endAyah": 18
    }
  ],
  "497": [
    {
      "surahId": 44,
      "startAyah": 19,
      "endAyah": 39
    }
  ],
  "498": [
    {
      "surahId": 44,
      "startAyah": 40,
      "endAyah": 59
    }
  ],
  "499": [
    {
      "surahId": 45,
      "startAyah": 1,
      "endAyah": 13
    }
  ],
  "500": [
    {
      "surahId": 45,
      "startAyah": 14,
      "endAyah": 22
    }
  ],
  "501": [
    {
      "surahId": 45,
      "startAyah": 23,
      "endAyah": 32
    }
  ],
  "502": [
    {
      "surahId": 45,
      "startAyah": 33,
      "endAyah": 37
    },
    {
      "surahId": 46,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "503": [
    {
      "surahId": 46,
      "startAyah": 6,
      "endAyah": 14
    }
  ],
  "504": [
    {
      "surahId": 46,
      "startAyah": 15,
      "endAyah": 20
    }
  ],
  "505": [
    {
      "surahId": 46,
      "startAyah": 21,
      "endAyah": 28
    }
  ],
  "506": [
    {
      "surahId": 46,
      "startAyah": 29,
      "endAyah": 35
    }
  ],
  "507": [
    {
      "surahId": 47,
      "startAyah": 1,
      "endAyah": 11
    }
  ],
  "508": [
    {
      "surahId": 47,
      "startAyah": 12,
      "endAyah": 19
    }
  ],
  "509": [
    {
      "surahId": 47,
      "startAyah": 20,
      "endAyah": 29
    }
  ],
  "510": [
    {
      "surahId": 47,
      "startAyah": 30,
      "endAyah": 38
    }
  ],
  "511": [
    {
      "surahId": 48,
      "startAyah": 1,
      "endAyah": 9
    }
  ],
  "512": [
    {
      "surahId": 48,
      "startAyah": 10,
      "endAyah": 15
    }
  ],
  "513": [
    {
      "surahId": 48,
      "startAyah": 16,
      "endAyah": 23
    }
  ],
  "514": [
    {
      "surahId": 48,
      "startAyah": 24,
      "endAyah": 28
    }
  ],
  "515": [
    {
      "surahId": 48,
      "startAyah": 29,
      "endAyah": 29
    },
    {
      "surahId": 49,
      "startAyah": 1,
      "endAyah": 4
    }
  ],
  "516": [
    {
      "surahId": 49,
      "startAyah": 5,
      "endAyah": 11
    }
  ],
  "517": [
    {
      "surahId": 49,
      "startAyah": 12,
      "endAyah": 18
    }
  ],
  "518": [
    {
      "surahId": 50,
      "startAyah": 1,
      "endAyah": 15
    }
  ],
  "519": [
    {
      "surahId": 50,
      "startAyah": 16,
      "endAyah": 35
    }
  ],
  "520": [
    {
      "surahId": 50,
      "startAyah": 36,
      "endAyah": 45
    },
    {
      "surahId": 51,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "521": [
    {
      "surahId": 51,
      "startAyah": 7,
      "endAyah": 30
    }
  ],
  "522": [
    {
      "surahId": 51,
      "startAyah": 31,
      "endAyah": 51
    }
  ],
  "523": [
    {
      "surahId": 51,
      "startAyah": 52,
      "endAyah": 60
    },
    {
      "surahId": 52,
      "startAyah": 1,
      "endAyah": 14
    }
  ],
  "524": [
    {
      "surahId": 52,
      "startAyah": 15,
      "endAyah": 31
    }
  ],
  "525": [
    {
      "surahId": 52,
      "startAyah": 32,
      "endAyah": 49
    }
  ],
  "526": [
    {
      "surahId": 53,
      "startAyah": 1,
      "endAyah": 26
    }
  ],
  "527": [
    {
      "surahId": 53,
      "startAyah": 27,
      "endAyah": 44
    }
  ],
  "528": [
    {
      "surahId": 53,
      "startAyah": 45,
      "endAyah": 62
    },
    {
      "surahId": 54,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "529": [
    {
      "surahId": 54,
      "startAyah": 7,
      "endAyah": 27
    }
  ],
  "530": [
    {
      "surahId": 54,
      "startAyah": 28,
      "endAyah": 49
    }
  ],
  "531": [
    {
      "surahId": 54,
      "startAyah": 50,
      "endAyah": 55
    },
    {
      "surahId": 55,
      "startAyah": 1,
      "endAyah": 16
    }
  ],
  "532": [
    {
      "surahId": 55,
      "startAyah": 17,
      "endAyah": 40
    }
  ],
  "533": [
    {
      "surahId": 55,
      "startAyah": 41,
      "endAyah": 67
    }
  ],
  "534": [
    {
      "surahId": 55,
      "startAyah": 68,
      "endAyah": 78
    },
    {
      "surahId": 56,
      "startAyah": 1,
      "endAyah": 16
    }
  ],
  "535": [
    {
      "surahId": 56,
      "startAyah": 17,
      "endAyah": 50
    }
  ],
  "536": [
    {
      "surahId": 56,
      "startAyah": 51,
      "endAyah": 76
    }
  ],
  "537": [
    {
      "surahId": 56,
      "startAyah": 77,
      "endAyah": 96
    },
    {
      "surahId": 57,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "538": [
    {
      "surahId": 57,
      "startAyah": 4,
      "endAyah": 11
    }
  ],
  "539": [
    {
      "surahId": 57,
      "startAyah": 12,
      "endAyah": 18
    }
  ],
  "540": [
    {
      "surahId": 57,
      "startAyah": 19,
      "endAyah": 24
    }
  ],
  "541": [
    {
      "surahId": 57,
      "startAyah": 25,
      "endAyah": 29
    }
  ],
  "542": [
    {
      "surahId": 58,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "543": [
    {
      "surahId": 58,
      "startAyah": 7,
      "endAyah": 11
    }
  ],
  "544": [
    {
      "surahId": 58,
      "startAyah": 12,
      "endAyah": 21
    }
  ],
  "545": [
    {
      "surahId": 58,
      "startAyah": 22,
      "endAyah": 22
    },
    {
      "surahId": 59,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "546": [
    {
      "surahId": 59,
      "startAyah": 4,
      "endAyah": 9
    }
  ],
  "547": [
    {
      "surahId": 59,
      "startAyah": 10,
      "endAyah": 16
    }
  ],
  "548": [
    {
      "surahId": 59,
      "startAyah": 17,
      "endAyah": 24
    }
  ],
  "549": [
    {
      "surahId": 60,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "550": [
    {
      "surahId": 60,
      "startAyah": 6,
      "endAyah": 11
    }
  ],
  "551": [
    {
      "surahId": 60,
      "startAyah": 12,
      "endAyah": 13
    },
    {
      "surahId": 61,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "552": [
    {
      "surahId": 61,
      "startAyah": 6,
      "endAyah": 14
    }
  ],
  "553": [
    {
      "surahId": 62,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "554": [
    {
      "surahId": 62,
      "startAyah": 9,
      "endAyah": 11
    },
    {
      "surahId": 63,
      "startAyah": 1,
      "endAyah": 4
    }
  ],
  "555": [
    {
      "surahId": 63,
      "startAyah": 5,
      "endAyah": 11
    }
  ],
  "556": [
    {
      "surahId": 64,
      "startAyah": 1,
      "endAyah": 9
    }
  ],
  "557": [
    {
      "surahId": 64,
      "startAyah": 10,
      "endAyah": 18
    }
  ],
  "558": [
    {
      "surahId": 65,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "559": [
    {
      "surahId": 65,
      "startAyah": 6,
      "endAyah": 12
    }
  ],
  "560": [
    {
      "surahId": 66,
      "startAyah": 1,
      "endAyah": 7
    }
  ],
  "561": [
    {
      "surahId": 66,
      "startAyah": 8,
      "endAyah": 12
    }
  ],
  "562": [
    {
      "surahId": 67,
      "startAyah": 1,
      "endAyah": 12
    }
  ],
  "563": [
    {
      "surahId": 67,
      "startAyah": 13,
      "endAyah": 26
    }
  ],
  "564": [
    {
      "surahId": 67,
      "startAyah": 27,
      "endAyah": 30
    },
    {
      "surahId": 68,
      "startAyah": 1,
      "endAyah": 15
    }
  ],
  "565": [
    {
      "surahId": 68,
      "startAyah": 16,
      "endAyah": 42
    }
  ],
  "566": [
    {
      "surahId": 68,
      "startAyah": 43,
      "endAyah": 52
    },
    {
      "surahId": 69,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "567": [
    {
      "surahId": 69,
      "startAyah": 9,
      "endAyah": 34
    }
  ],
  "568": [
    {
      "surahId": 69,
      "startAyah": 35,
      "endAyah": 52
    },
    {
      "surahId": 70,
      "startAyah": 1,
      "endAyah": 10
    }
  ],
  "569": [
    {
      "surahId": 70,
      "startAyah": 11,
      "endAyah": 39
    }
  ],
  "570": [
    {
      "surahId": 70,
      "startAyah": 40,
      "endAyah": 44
    },
    {
      "surahId": 71,
      "startAyah": 1,
      "endAyah": 10
    }
  ],
  "571": [
    {
      "surahId": 71,
      "startAyah": 11,
      "endAyah": 28
    }
  ],
  "572": [
    {
      "surahId": 72,
      "startAyah": 1,
      "endAyah": 13
    }
  ],
  "573": [
    {
      "surahId": 72,
      "startAyah": 14,
      "endAyah": 28
    }
  ],
  "574": [
    {
      "surahId": 73,
      "startAyah": 1,
      "endAyah": 19
    }
  ],
  "575": [
    {
      "surahId": 73,
      "startAyah": 20,
      "endAyah": 20
    },
    {
      "surahId": 74,
      "startAyah": 1,
      "endAyah": 17
    }
  ],
  "576": [
    {
      "surahId": 74,
      "startAyah": 18,
      "endAyah": 47
    }
  ],
  "577": [
    {
      "surahId": 74,
      "startAyah": 48,
      "endAyah": 56
    },
    {
      "surahId": 75,
      "startAyah": 1,
      "endAyah": 19
    }
  ],
  "578": [
    {
      "surahId": 75,
      "startAyah": 20,
      "endAyah": 40
    },
    {
      "surahId": 76,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "579": [
    {
      "surahId": 76,
      "startAyah": 6,
      "endAyah": 25
    }
  ],
  "580": [
    {
      "surahId": 76,
      "startAyah": 26,
      "endAyah": 31
    },
    {
      "surahId": 77,
      "startAyah": 1,
      "endAyah": 19
    }
  ],
  "581": [
    {
      "surahId": 77,
      "startAyah": 20,
      "endAyah": 50
    }
  ],
  "582": [
    {
      "surahId": 78,
      "startAyah": 1,
      "endAyah": 30
    }
  ],
  "583": [
    {
      "surahId": 78,
      "startAyah": 31,
      "endAyah": 40
    },
    {
      "surahId": 79,
      "startAyah": 1,
      "endAyah": 15
    }
  ],
  "584": [
    {
      "surahId": 79,
      "startAyah": 16,
      "endAyah": 46
    }
  ],
  "585": [
    {
      "surahId": 80,
      "startAyah": 1,
      "endAyah": 42
    }
  ],
  "586": [
    {
      "surahId": 81,
      "startAyah": 1,
      "endAyah": 29
    }
  ],
  "587": [
    {
      "surahId": 82,
      "startAyah": 1,
      "endAyah": 19
    },
    {
      "surahId": 83,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "588": [
    {
      "surahId": 83,
      "startAyah": 7,
      "endAyah": 34
    }
  ],
  "589": [
    {
      "surahId": 83,
      "startAyah": 35,
      "endAyah": 36
    },
    {
      "surahId": 84,
      "startAyah": 1,
      "endAyah": 25
    }
  ],
  "590": [
    {
      "surahId": 85,
      "startAyah": 1,
      "endAyah": 22
    }
  ],
  "591": [
    {
      "surahId": 86,
      "startAyah": 1,
      "endAyah": 17
    },
    {
      "surahId": 87,
      "startAyah": 1,
      "endAyah": 15
    }
  ],
  "592": [
    {
      "surahId": 87,
      "startAyah": 16,
      "endAyah": 19
    },
    {
      "surahId": 88,
      "startAyah": 1,
      "endAyah": 26
    }
  ],
  "593": [
    {
      "surahId": 89,
      "startAyah": 1,
      "endAyah": 23
    }
  ],
  "594": [
    {
      "surahId": 89,
      "startAyah": 24,
      "endAyah": 30
    },
    {
      "surahId": 90,
      "startAyah": 1,
      "endAyah": 20
    }
  ],
  "595": [
    {
      "surahId": 91,
      "startAyah": 1,
      "endAyah": 15
    },
    {
      "surahId": 92,
      "startAyah": 1,
      "endAyah": 14
    }
  ],
  "596": [
    {
      "surahId": 92,
      "startAyah": 15,
      "endAyah": 21
    },
    {
      "surahId": 93,
      "startAyah": 1,
      "endAyah": 11
    },
    {
      "surahId": 94,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "597": [
    {
      "surahId": 95,
      "startAyah": 1,
      "endAyah": 8
    },
    {
      "surahId": 96,
      "startAyah": 1,
      "endAyah": 19
    }
  ],
  "598": [
    {
      "surahId": 97,
      "startAyah": 1,
      "endAyah": 5
    },
    {
      "surahId": 98,
      "startAyah": 1,
      "endAyah": 7
    }
  ],
  "599": [
    {
      "surahId": 98,
      "startAyah": 8,
      "endAyah": 8
    },
    {
      "surahId": 99,
      "startAyah": 1,
      "endAyah": 8
    },
    {
      "surahId": 100,
      "startAyah": 1,
      "endAyah": 9
    }
  ],
  "600": [
    {
      "surahId": 100,
      "startAyah": 10,
      "endAyah": 11
    },
    {
      "surahId": 101,
      "startAyah": 1,
      "endAyah": 11
    },
    {
      "surahId": 102,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "601": [
    {
      "surahId": 103,
      "startAyah": 1,
      "endAyah": 3
    },
    {
      "surahId": 104,
      "startAyah": 1,
      "endAyah": 9
    },
    {
      "surahId": 105,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "602": [
    {
      "surahId": 106,
      "startAyah": 1,
      "endAyah": 4
    },
    {
      "surahId": 107,
      "startAyah": 1,
      "endAyah": 7
    },
    {
      "surahId": 108,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "603": [
    {
      "surahId": 109,
      "startAyah": 1,
      "endAyah": 6
    },
    {
      "surahId": 110,
      "startAyah": 1,
      "endAyah": 3
    },
    {
      "surahId": 111,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "604": [
    {
      "surahId": 112,
      "startAyah": 1,
      "endAyah": 4
    },
    {
      "surahId": 113,
      "startAyah": 1,
      "endAyah": 5
    },
    {
      "surahId": 114,
      "startAyah": 1,
      "endAyah": 6
    }
  ]
};
