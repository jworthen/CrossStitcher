// Cross-brand floss conversion data.
//
// DMC is treated as canonical — every other brand maps to a DMC number, and
// Thready's inventory is keyed by DMC. The conversions below are sourced from
// publicly available manufacturer charts. Coverage is partial: hand-dyed
// brands (Weeks Dye Works, The Gentle Art) are variegated and only have
// approximate equivalents, so we include just well-known matches.

export type BrandId = 'dmc' | 'anchor' | 'madeira' | 'cosmo' | 'jp_coats' | 'weeks' | 'gentle_art'

export interface Brand {
  id: BrandId
  name: string
  shortName: string
  /** Hand-dyed/variegated brands have approximate, not exact, conversions. */
  approximate?: boolean
}

export const BRANDS: Brand[] = [
  { id: 'dmc',         name: 'DMC',                 shortName: 'DMC' },
  { id: 'anchor',      name: 'Anchor',              shortName: 'Anchor' },
  { id: 'madeira',     name: 'Madeira',             shortName: 'Madeira' },
  { id: 'cosmo',       name: 'Cosmo (Lecien)',      shortName: 'Cosmo' },
  { id: 'jp_coats',    name: 'J&P Coats',           shortName: 'J&P' },
  { id: 'weeks',       name: 'Weeks Dye Works',     shortName: 'Weeks',       approximate: true },
  { id: 'gentle_art',  name: 'The Gentle Art',      shortName: 'Gentle Art',  approximate: true },
]

export const BRAND_BY_ID: Record<BrandId, Brand> =
  Object.fromEntries(BRANDS.map((b) => [b.id, b])) as Record<BrandId, Brand>

export interface Conversions {
  anchor?: string
  madeira?: string
  cosmo?: string
  jp_coats?: string
  weeks?: string
  gentle_art?: string
}

// DMC number → equivalents in other brands. Missing entries simply have no
// known mapping in our table — the UI displays "—" for those.
export const CONVERSIONS: Record<string, Conversions> = {
  // Whites & off-whites
  'Blanc': { anchor: '2',    madeira: '2401', cosmo: '100',  jp_coats: '1001' },
  'Ecru':  { anchor: '387',  madeira: '2404', cosmo: '305',  jp_coats: '1002' },

  // Reds
  '304':  { anchor: '1006', madeira: '0511', cosmo: '240' },
  '321':  { anchor: '9046', madeira: '0510', cosmo: '506',  jp_coats: '3500' },
  '326':  { anchor: '59',   madeira: '0508' },
  '347':  { anchor: '1025', madeira: '0407', cosmo: '245' },
  '349':  { anchor: '13',   madeira: '0212' },
  '350':  { anchor: '11',   madeira: '0213' },
  '351':  { anchor: '10',   madeira: '0214' },
  '352':  { anchor: '9',    madeira: '0303' },
  '353':  { anchor: '6',    madeira: '0304' },
  '498':  { anchor: '1005', madeira: '0511' },
  '666':  { anchor: '46',   madeira: '0210', cosmo: '800',  jp_coats: '3046' },
  '814':  { anchor: '45',   madeira: '0514' },
  '815':  { anchor: '44',   madeira: '0513' },
  '816':  { anchor: '1005', madeira: '0512' },
  '817':  { anchor: '13',   madeira: '0211' },
  '891':  { anchor: '35',   madeira: '0411' },
  '892':  { anchor: '33',   madeira: '0412' },
  '893':  { anchor: '27',   madeira: '0413' },
  '894':  { anchor: '26',   madeira: '0414' },
  '3705': { anchor: '35',   madeira: '0410' },
  '3706': { anchor: '33',   madeira: '0409' },
  '3708': { anchor: '31',   madeira: '0408' },
  '3801': { anchor: '1098', madeira: '0411' },

  // Pinks
  '600':  { anchor: '59' },
  '601':  { anchor: '63' },
  '602':  { anchor: '57' },
  '603':  { anchor: '62' },
  '604':  { anchor: '55' },
  '605':  { anchor: '50' },
  '718':  { anchor: '88' },
  '760':  { anchor: '1022', madeira: '0405' },
  '761':  { anchor: '1021', madeira: '0404' },
  '776':  { anchor: '24',   madeira: '0606' },
  '818':  { anchor: '23',   madeira: '0502', cosmo: '101' },
  '819':  { anchor: '271',  madeira: '0501' },
  '899':  { anchor: '38',   madeira: '0505' },
  '957':  { anchor: '50' },
  '962':  { anchor: '75' },
  '963':  { anchor: '73',   madeira: '0503' },
  '3326': { anchor: '36',   madeira: '0504' },
  '3354': { anchor: '74' },
  '3713': { anchor: '1020', madeira: '0502' },

  // Yellows & oranges
  '307':  { anchor: '289',  madeira: '0104' },
  '444':  { anchor: '290',  madeira: '0105' },
  '445':  { anchor: '288' },
  '720':  { anchor: '326' },
  '721':  { anchor: '925' },
  '722':  { anchor: '323' },
  '725':  { anchor: '305',  madeira: '0113' },
  '726':  { anchor: '295',  madeira: '0109' },
  '727':  { anchor: '293',  madeira: '0110' },
  '740':  { anchor: '316',  madeira: '0203' },
  '741':  { anchor: '304',  madeira: '0201' },
  '742':  { anchor: '303',  madeira: '0114' },
  '743':  { anchor: '302',  madeira: '0113' },
  '744':  { anchor: '301',  madeira: '0112' },
  '745':  { anchor: '300',  madeira: '0111' },
  '754':  { anchor: '1012', madeira: '0305' },
  '783':  { anchor: '307',  madeira: '2211' },
  '900':  { anchor: '333' },
  '921':  { anchor: '1004', madeira: '0311' },
  '922':  { anchor: '1003', madeira: '0310' },
  '945':  { anchor: '881' },
  '946':  { anchor: '332' },
  '947':  { anchor: '330',  madeira: '0205' },
  '970':  { anchor: '925' },
  '971':  { anchor: '316' },
  '972':  { anchor: '298',  madeira: '0107' },
  '973':  { anchor: '297',  madeira: '0105' },
  '975':  { anchor: '357',  madeira: '2303' },
  '976':  { anchor: '1001', madeira: '2302' },
  '977':  { anchor: '1002', madeira: '2301' },
  '3340': { anchor: '329' },
  '3341': { anchor: '328' },
  '3825': { anchor: '323' },

  // Greens
  '367':  { anchor: '217' },
  '368':  { anchor: '214' },
  '369':  { anchor: '1043' },
  '470':  { anchor: '267' },
  '471':  { anchor: '266' },
  '472':  { anchor: '253' },
  '500':  { anchor: '683',  madeira: '1705' },
  '501':  { anchor: '878',  madeira: '1704' },
  '502':  { anchor: '877',  madeira: '1703' },
  '503':  { anchor: '875',  madeira: '1702' },
  '504':  { anchor: '1042', madeira: '1701' },
  '561':  { anchor: '212' },
  '562':  { anchor: '210' },
  '563':  { anchor: '208' },
  '564':  { anchor: '206' },
  '580':  { anchor: '281' },
  '581':  { anchor: '280' },
  '699':  { anchor: '923',  madeira: '1303' },
  '700':  { anchor: '228',  madeira: '1304' },
  '701':  { anchor: '227',  madeira: '1305' },
  '702':  { anchor: '226',  madeira: '1306' },
  '703':  { anchor: '238',  madeira: '1307' },
  '704':  { anchor: '256',  madeira: '1308' },
  '772':  { anchor: '259' },
  '904':  { anchor: '258' },
  '905':  { anchor: '257' },
  '906':  { anchor: '256' },
  '907':  { anchor: '255' },
  '909':  { anchor: '230' },
  '910':  { anchor: '229' },
  '911':  { anchor: '205' },
  '912':  { anchor: '209' },
  '913':  { anchor: '204' },
  '936':  { anchor: '846' },
  '937':  { anchor: '268' },
  '954':  { anchor: '203' },
  '955':  { anchor: '206' },
  '966':  { anchor: '240' },
  '986':  { anchor: '246' },
  '987':  { anchor: '244' },
  '988':  { anchor: '243' },
  '989':  { anchor: '242' },
  '991':  { anchor: '1076' },
  '992':  { anchor: '1072' },
  '993':  { anchor: '1070' },
  '3346': { anchor: '267' },
  '3347': { anchor: '266' },
  '3348': { anchor: '264' },
  '3363': { anchor: '262' },
  '3364': { anchor: '261' },

  // Blues
  '311':  { anchor: '148' },
  '312':  { anchor: '979' },
  '322':  { anchor: '978' },
  '334':  { anchor: '977' },
  '336':  { anchor: '150' },
  '517':  { anchor: '162' },
  '518':  { anchor: '1039' },
  '519':  { anchor: '1038' },
  '597':  { anchor: '1064' },
  '598':  { anchor: '1062' },
  '747':  { anchor: '158' },
  '791':  { anchor: '178' },
  '792':  { anchor: '941' },
  '793':  { anchor: '176' },
  '794':  { anchor: '175' },
  '796':  { anchor: '133' },
  '797':  { anchor: '132' },
  '798':  { anchor: '131' },
  '799':  { anchor: '145' },
  '800':  { anchor: '144' },
  '807':  { anchor: '168' },
  '809':  { anchor: '130' },
  '813':  { anchor: '161' },
  '820':  { anchor: '134' },
  '823':  { anchor: '152' },
  '824':  { anchor: '164' },
  '825':  { anchor: '162' },
  '826':  { anchor: '161' },
  '827':  { anchor: '159' },
  '828':  { anchor: '9159' },
  '930':  { anchor: '1035' },
  '931':  { anchor: '1034' },
  '932':  { anchor: '1033' },
  '939':  { anchor: '152' },
  '995':  { anchor: '410' },
  '996':  { anchor: '433' },
  '3325': { anchor: '129' },
  '3750': { anchor: '1036' },
  '3752': { anchor: '1032' },
  '3753': { anchor: '1031' },
  '3755': { anchor: '140' },
  '3760': { anchor: '162' },
  '3761': { anchor: '928' },
  '3765': { anchor: '170' },
  '3766': { anchor: '167' },
  '3768': { anchor: '779' },

  // Purples & violets
  '208':  { anchor: '110' },
  '209':  { anchor: '109' },
  '210':  { anchor: '108' },
  '211':  { anchor: '342' },
  '327':  { anchor: '100' },
  '333':  { anchor: '119' },
  '340':  { anchor: '118' },
  '341':  { anchor: '117' },
  '550':  { anchor: '102' },
  '552':  { anchor: '99' },
  '553':  { anchor: '98' },
  '554':  { anchor: '96' },
  '915':  { anchor: '1029' },
  '917':  { anchor: '89' },
  '3041': { anchor: '871' },
  '3042': { anchor: '870' },
  '3607': { anchor: '87' },
  '3608': { anchor: '86' },
  '3609': { anchor: '85' },
  '3740': { anchor: '872' },
  '3746': { anchor: '1030' },
  '3747': { anchor: '120' },

  // Browns
  '300':  { anchor: '352' },
  '301':  { anchor: '1049' },
  '400':  { anchor: '351' },
  '402':  { anchor: '1047' },
  '433':  { anchor: '358' },
  '434':  { anchor: '310' },
  '435':  { anchor: '1046' },
  '436':  { anchor: '363' },
  '437':  { anchor: '362' },
  '543':  { anchor: '933' },
  '632':  { anchor: '936' },
  '729':  { anchor: '890' },
  '738':  { anchor: '361' },
  '739':  { anchor: '366' },
  '780':  { anchor: '309' },
  '781':  { anchor: '308' },
  '782':  { anchor: '308' },
  '801':  { anchor: '359' },
  '838':  { anchor: '1088' },
  '839':  { anchor: '360' },
  '840':  { anchor: '379' },
  '841':  { anchor: '378' },
  '842':  { anchor: '388' },
  '869':  { anchor: '944' },
  '898':  { anchor: '360' },
  '938':  { anchor: '381' },
  '3022': { anchor: '8581' },
  '3023': { anchor: '1040' },
  '3024': { anchor: '397' },
  '3031': { anchor: '905' },
  '3032': { anchor: '898' },
  '3033': { anchor: '387' },
  '3045': { anchor: '888' },
  '3046': { anchor: '887' },
  '3047': { anchor: '852' },
  '3371': { anchor: '382' },
  '3772': { anchor: '1007' },
  '3773': { anchor: '1008' },
  '3774': { anchor: '778' },
  '3776': { anchor: '1048' },
  '3777': { anchor: '1015' },
  '3778': { anchor: '1013' },
  '3826': { anchor: '1049' },
  '3827': { anchor: '311' },

  // Grays & blacks
  '310':  { anchor: '403',  madeira: '2400', cosmo: '600', jp_coats: '8403' },
  '317':  { anchor: '400' },
  '318':  { anchor: '399' },
  '413':  { anchor: '401' },
  '414':  { anchor: '235' },
  '415':  { anchor: '398' },
  '535':  { anchor: '401' },
  '762':  { anchor: '234' },
  '844':  { anchor: '1041' },
  '3787': { anchor: '904' },
  '3799': { anchor: '236' },
}

// Reverse lookup: brand-specific code → DMC number. Built lazily on first use.
const reverseMaps: Partial<Record<BrandId, Map<string, string>>> = {}

function getReverseMap(brand: BrandId): Map<string, string> {
  if (brand === 'dmc') {
    throw new Error('Use DMC numbers directly — no reverse map needed')
  }
  let map = reverseMaps[brand]
  if (map) return map
  map = new Map()
  for (const [dmc, eqs] of Object.entries(CONVERSIONS)) {
    const code = eqs[brand]
    if (code && !map.has(code)) map.set(code, dmc)
  }
  reverseMaps[brand] = map
  return map
}

/** Returns the DMC number that matches the given brand-specific code, or null. */
export function dmcFromBrandCode(brand: BrandId, code: string): string | null {
  const t = code.trim()
  if (!t) return null
  if (brand === 'dmc') return t
  return getReverseMap(brand).get(t) ?? null
}

/** Returns the brand code for `dmcNumber` in `brand`, or null if not in the chart. */
export function brandCodeFor(brand: BrandId, dmcNumber: string): string | null {
  if (brand === 'dmc') return dmcNumber
  return CONVERSIONS[dmcNumber]?.[brand] ?? null
}

/**
 * Returns every brand whose code matches `query` for this DMC color.
 * Used to make a single search box hit "Anchor 47" or "Madeira 0510".
 */
export function matchesAnyBrandCode(dmcNumber: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return false
  if (dmcNumber.toLowerCase().includes(q)) return true
  const eqs = CONVERSIONS[dmcNumber]
  if (!eqs) return false
  for (const code of Object.values(eqs)) {
    if (code && code.toLowerCase().includes(q)) return true
  }
  return false
}
