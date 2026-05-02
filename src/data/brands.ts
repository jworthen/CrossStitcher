// Cross-brand floss conversion data and per-brand color catalogs.
//
// Each brand has its own inventory namespace — `dmc:321` and `anchor:9046`
// are tracked independently. Brand catalogs are partial: DMC ships a full
// list of ~480 colors; other brands are derived from the curated conversion
// chart below, so their browsable catalogs are limited to colors we have a
// confirmed cross-reference for. Hex values are inherited from the DMC
// equivalent (an approximation — the actual brand's red is not literally the
// same as DMC's). Hand-dyed brands (Weeks, Gentle Art) are intentionally
// sparse since their conversions are approximate by nature.

import { DMC_COLORS, DmcColor } from './dmcColors'

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
  '3865': { anchor: '2',    madeira: '2402' },

  // Reds
  '150':  { anchor: '59',   madeira: '0507' },
  '151':  { anchor: '73',   madeira: '0506' },
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
  '3712': { anchor: '1023', madeira: '0405' },
  '3801': { anchor: '1098', madeira: '0411' },
  '3803': { anchor: '69',   madeira: '0602' },
  '3804': { anchor: '63',   madeira: '0603' },
  '3805': { anchor: '62',   madeira: '0701' },
  '3806': { anchor: '76',   madeira: '0702' },
  '3831': { anchor: '29',   madeira: '0506' },
  '3832': { anchor: '28',   madeira: '0505' },
  '3833': { anchor: '31',   madeira: '0504' },

  // Pinks
  '152':  { anchor: '969',  madeira: '0810' },
  '223':  { anchor: '895',  madeira: '0812' },
  '224':  { anchor: '893',  madeira: '0813' },
  '225':  { anchor: '1026', madeira: '0814' },
  '600':  { anchor: '59' },
  '601':  { anchor: '63' },
  '602':  { anchor: '57' },
  '603':  { anchor: '62' },
  '604':  { anchor: '55' },
  '605':  { anchor: '50' },
  '760':  { anchor: '1022', madeira: '0405' },
  '761':  { anchor: '1021', madeira: '0404' },
  '776':  { anchor: '24',   madeira: '0606' },
  '818':  { anchor: '23',   madeira: '0502', cosmo: '101' },
  '819':  { anchor: '271',  madeira: '0501' },
  '899':  { anchor: '38',   madeira: '0505' },
  '956':  { anchor: '40',   madeira: '0611' },
  '957':  { anchor: '50' },
  '961':  { anchor: '76',   madeira: '0610' },
  '962':  { anchor: '75' },
  '963':  { anchor: '73',   madeira: '0503' },
  '3326': { anchor: '36',   madeira: '0504' },
  '3354': { anchor: '74' },
  '3713': { anchor: '1020', madeira: '0502' },
  '3716': { anchor: '25',   madeira: '0606' },
  '3727': { anchor: '969',  madeira: '0810' },
  '3733': { anchor: '75',   madeira: '0605' },
  '3731': { anchor: '76',   madeira: '0506' },

  // Yellows & oranges
  '165':  { anchor: '278',  madeira: '1414' },
  '166':  { anchor: '280',  madeira: '1413' },
  '167':  { anchor: '375',  madeira: '2105' },
  '307':  { anchor: '289',  madeira: '0104' },
  '444':  { anchor: '290',  madeira: '0105' },
  '445':  { anchor: '288' },
  '676':  { anchor: '891',  madeira: '2208' },
  '677':  { anchor: '361',  madeira: '2207' },
  '680':  { anchor: '901',  madeira: '2210' },
  '720':  { anchor: '326' },
  '721':  { anchor: '925' },
  '722':  { anchor: '323' },
  '725':  { anchor: '305',  madeira: '0113' },
  '726':  { anchor: '295',  madeira: '0109' },
  '727':  { anchor: '293',  madeira: '0110' },
  '728':  { anchor: '305',  madeira: '0113' },
  '729':  { anchor: '890',  madeira: '2209' },
  '740':  { anchor: '316',  madeira: '0203' },
  '741':  { anchor: '304',  madeira: '0201' },
  '742':  { anchor: '303',  madeira: '0114' },
  '743':  { anchor: '302',  madeira: '0113' },
  '744':  { anchor: '301',  madeira: '0112' },
  '745':  { anchor: '300',  madeira: '0111' },
  '754':  { anchor: '1012', madeira: '0305' },
  '758':  { anchor: '9575', madeira: '0403' },
  '783':  { anchor: '307',  madeira: '2211' },
  '900':  { anchor: '333' },
  '920':  { anchor: '1004', madeira: '0312' },
  '921':  { anchor: '1004', madeira: '0311' },
  '922':  { anchor: '1003', madeira: '0310' },
  '945':  { anchor: '881' },
  '946':  { anchor: '332' },
  '947':  { anchor: '330',  madeira: '0205' },
  '951':  { anchor: '880',  madeira: '2308' },
  '967':  { anchor: '1012', madeira: '0306' },
  '970':  { anchor: '925' },
  '971':  { anchor: '316' },
  '972':  { anchor: '298',  madeira: '0107' },
  '973':  { anchor: '297',  madeira: '0105' },
  '975':  { anchor: '357',  madeira: '2303' },
  '976':  { anchor: '1001', madeira: '2302' },
  '977':  { anchor: '1002', madeira: '2301' },
  '3340': { anchor: '329' },
  '3341': { anchor: '328' },
  '3820': { anchor: '306',  madeira: '2509' },
  '3821': { anchor: '305',  madeira: '2510' },
  '3822': { anchor: '295',  madeira: '2511' },
  '3823': { anchor: '386',  madeira: '0102' },
  '3824': { anchor: '8',    madeira: '0303' },
  '3825': { anchor: '323',  madeira: '0301' },
  '3852': { anchor: '306',  madeira: '2509' },
  '3853': { anchor: '1003', madeira: '2305' },
  '3854': { anchor: '313',  madeira: '2304' },
  '3855': { anchor: '311',  madeira: '0311' },
  '3856': { anchor: '347',  madeira: '0304' },

  // Greens
  '163':  { anchor: '878',  madeira: '1209' },
  '164':  { anchor: '240',  madeira: '1209' },
  '320':  { anchor: '215',  madeira: '1311' },
  '367':  { anchor: '217',  madeira: '1312' },
  '368':  { anchor: '214',  madeira: '1310' },
  '369':  { anchor: '1043', madeira: '1309' },
  '470':  { anchor: '267',  madeira: '1502' },
  '471':  { anchor: '266',  madeira: '1501' },
  '472':  { anchor: '253',  madeira: '1414' },
  '500':  { anchor: '683',  madeira: '1705' },
  '501':  { anchor: '878',  madeira: '1704' },
  '502':  { anchor: '877',  madeira: '1703' },
  '503':  { anchor: '875',  madeira: '1702' },
  '504':  { anchor: '1042', madeira: '1701' },
  '561':  { anchor: '212',  madeira: '1205' },
  '562':  { anchor: '210',  madeira: '1206' },
  '563':  { anchor: '208',  madeira: '1207' },
  '564':  { anchor: '206',  madeira: '1208' },
  '580':  { anchor: '281',  madeira: '1608' },
  '581':  { anchor: '280',  madeira: '1609' },
  '699':  { anchor: '923',  madeira: '1303' },
  '700':  { anchor: '228',  madeira: '1304' },
  '701':  { anchor: '227',  madeira: '1305' },
  '702':  { anchor: '226',  madeira: '1306' },
  '703':  { anchor: '238',  madeira: '1307' },
  '704':  { anchor: '256',  madeira: '1308' },
  '772':  { anchor: '259',  madeira: '1604' },
  '890':  { anchor: '218',  madeira: '1314' },
  '904':  { anchor: '258',  madeira: '1413' },
  '905':  { anchor: '257',  madeira: '1412' },
  '906':  { anchor: '256',  madeira: '1411' },
  '907':  { anchor: '255',  madeira: '1410' },
  '909':  { anchor: '230',  madeira: '1303' },
  '910':  { anchor: '229',  madeira: '1302' },
  '911':  { anchor: '205',  madeira: '1214' },
  '912':  { anchor: '209',  madeira: '1213' },
  '913':  { anchor: '204',  madeira: '1212' },
  '936':  { anchor: '846',  madeira: '1507' },
  '937':  { anchor: '268',  madeira: '1504' },
  '954':  { anchor: '203',  madeira: '1211' },
  '955':  { anchor: '206',  madeira: '1210' },
  '958':  { anchor: '187',  madeira: '1114' },
  '959':  { anchor: '186',  madeira: '1113' },
  '964':  { anchor: '185',  madeira: '1112' },
  '966':  { anchor: '240',  madeira: '1209' },
  '986':  { anchor: '246',  madeira: '1404' },
  '987':  { anchor: '244',  madeira: '1403' },
  '988':  { anchor: '243',  madeira: '1402' },
  '989':  { anchor: '242',  madeira: '1401' },
  '991':  { anchor: '1076', madeira: '1204' },
  '992':  { anchor: '1072', madeira: '1202' },
  '993':  { anchor: '1070', madeira: '1201' },
  '3346': { anchor: '267',  madeira: '1407' },
  '3347': { anchor: '266',  madeira: '1408' },
  '3348': { anchor: '264',  madeira: '1409' },
  '3363': { anchor: '262',  madeira: '1602' },
  '3364': { anchor: '261',  madeira: '1603' },
  '3812': { anchor: '188',  madeira: '1203' },
  '3813': { anchor: '875',  madeira: '1701' },
  '3814': { anchor: '1074', madeira: '1108' },
  '3815': { anchor: '877',  madeira: '1703' },
  '3816': { anchor: '876',  madeira: '1702' },
  '3817': { anchor: '875',  madeira: '1701' },
  '3818': { anchor: '923',  madeira: '1303' },
  '3819': { anchor: '278',  madeira: '1414' },

  // Blues
  '157':  { anchor: '120',  madeira: '0908' },
  '158':  { anchor: '178',  madeira: '0908' },
  '160':  { anchor: '175',  madeira: '0907' },
  '161':  { anchor: '176',  madeira: '0907' },
  '162':  { anchor: '9159', madeira: '1102' },
  '168':  { anchor: '274',  madeira: '1810' },
  '311':  { anchor: '148',  madeira: '1007' },
  '312':  { anchor: '979',  madeira: '1005' },
  '322':  { anchor: '978',  madeira: '1004' },
  '334':  { anchor: '977',  madeira: '1003' },
  '336':  { anchor: '150',  madeira: '1007' },
  '517':  { anchor: '162',  madeira: '1107' },
  '518':  { anchor: '1039', madeira: '1106' },
  '519':  { anchor: '1038', madeira: '1105' },
  '597':  { anchor: '1064', madeira: '1110' },
  '598':  { anchor: '1062', madeira: '1111' },
  '747':  { anchor: '158',  madeira: '1104' },
  '791':  { anchor: '178',  madeira: '0904' },
  '792':  { anchor: '941',  madeira: '0905' },
  '793':  { anchor: '176',  madeira: '0906' },
  '794':  { anchor: '175',  madeira: '0907' },
  '796':  { anchor: '133',  madeira: '0913' },
  '797':  { anchor: '132',  madeira: '0912' },
  '798':  { anchor: '131',  madeira: '0911' },
  '799':  { anchor: '145',  madeira: '0910' },
  '800':  { anchor: '144',  madeira: '0908' },
  '807':  { anchor: '168',  madeira: '1108' },
  '809':  { anchor: '130',  madeira: '0909' },
  '813':  { anchor: '161',  madeira: '1013' },
  '820':  { anchor: '134',  madeira: '0904' },
  '823':  { anchor: '152',  madeira: '1008' },
  '824':  { anchor: '164',  madeira: '1010' },
  '825':  { anchor: '162',  madeira: '1011' },
  '826':  { anchor: '161',  madeira: '1012' },
  '827':  { anchor: '159',  madeira: '1014' },
  '828':  { anchor: '9159', madeira: '1101' },
  '930':  { anchor: '1035', madeira: '1712' },
  '931':  { anchor: '1034', madeira: '1711' },
  '932':  { anchor: '1033', madeira: '1710' },
  '939':  { anchor: '152',  madeira: '1009' },
  '995':  { anchor: '410',  madeira: '1102' },
  '996':  { anchor: '433',  madeira: '1103' },
  '3325': { anchor: '129',  madeira: '1002' },
  '3750': { anchor: '1036', madeira: '1712' },
  '3752': { anchor: '1032', madeira: '1710' },
  '3753': { anchor: '1031', madeira: '1709' },
  '3755': { anchor: '140',  madeira: '0906' },
  '3756': { anchor: '1037', madeira: '1107' },
  '3760': { anchor: '162',  madeira: '1107' },
  '3761': { anchor: '928',  madeira: '1014' },
  '3765': { anchor: '170',  madeira: '1107' },
  '3766': { anchor: '167',  madeira: '1109' },
  '3768': { anchor: '779',  madeira: '1706' },
  '3807': { anchor: '122',  madeira: '0909' },
  '3808': { anchor: '1068', madeira: '2507' },
  '3809': { anchor: '1066', madeira: '2507' },
  '3810': { anchor: '1066', madeira: '2508' },
  '3811': { anchor: '1060', madeira: '1101' },
  '3839': { anchor: '121',  madeira: '0909' },
  '3840': { anchor: '120',  madeira: '0907' },
  '3841': { anchor: '159',  madeira: '1014' },
  '3842': { anchor: '164',  madeira: '1009' },
  '3843': { anchor: '1089', madeira: '0909' },
  '3844': { anchor: '410',  madeira: '1102' },
  '3845': { anchor: '1089', madeira: '1101' },
  '3846': { anchor: '1090', madeira: '1102' },

  // Purples & violets
  '153':  { anchor: '95',   madeira: '0712' },
  '154':  { anchor: '873',  madeira: '2614' },
  '155':  { anchor: '1030', madeira: '0902' },
  '208':  { anchor: '110',  madeira: '0804' },
  '209':  { anchor: '109',  madeira: '0803' },
  '210':  { anchor: '108',  madeira: '0802' },
  '211':  { anchor: '342',  madeira: '0801' },
  '327':  { anchor: '100',  madeira: '0805' },
  '333':  { anchor: '119',  madeira: '0903' },
  '340':  { anchor: '118',  madeira: '0902' },
  '341':  { anchor: '117',  madeira: '0901' },
  '550':  { anchor: '102',  madeira: '0714' },
  '552':  { anchor: '99',   madeira: '0713' },
  '553':  { anchor: '98',   madeira: '0712' },
  '554':  { anchor: '96',   madeira: '0711' },
  '718':  { anchor: '88',   madeira: '0707' },
  '778':  { anchor: '968',  madeira: '0808' },
  '902':  { anchor: '897',  madeira: '0601' },
  '915':  { anchor: '1029', madeira: '0705' },
  '917':  { anchor: '89',   madeira: '0706' },
  '3041': { anchor: '871',  madeira: '0806' },
  '3042': { anchor: '870',  madeira: '0807' },
  '3607': { anchor: '87',   madeira: '0708' },
  '3608': { anchor: '86',   madeira: '0709' },
  '3609': { anchor: '85',   madeira: '0710' },
  '3740': { anchor: '872',  madeira: '0806' },
  '3743': { anchor: '869',  madeira: '0808' },
  '3746': { anchor: '1030', madeira: '0903' },
  '3747': { anchor: '120',  madeira: '0907' },
  '3834': { anchor: '100',  madeira: '0805' },
  '3835': { anchor: '98',   madeira: '0712' },
  '3836': { anchor: '90',   madeira: '0711' },
  '3837': { anchor: '100',  madeira: '0714' },
  '3858': { anchor: '914',  madeira: '0508' },
  '3860': { anchor: '379',  madeira: '0810' },

  // Browns
  '300':  { anchor: '352',  madeira: '2304' },
  '301':  { anchor: '1049', madeira: '2306' },
  '400':  { anchor: '351',  madeira: '2305' },
  '402':  { anchor: '1047', madeira: '2307' },
  '433':  { anchor: '358',  madeira: '2008' },
  '434':  { anchor: '310',  madeira: '2009' },
  '435':  { anchor: '1046', madeira: '2010' },
  '436':  { anchor: '363',  madeira: '2011' },
  '437':  { anchor: '362',  madeira: '2012' },
  '543':  { anchor: '933',  madeira: '1909' },
  '610':  { anchor: '889',  madeira: '2106' },
  '611':  { anchor: '898',  madeira: '2107' },
  '612':  { anchor: '832',  madeira: '2108' },
  '613':  { anchor: '831',  madeira: '2109' },
  '632':  { anchor: '936',  madeira: '2311' },
  '780':  { anchor: '309',  madeira: '2214' },
  '781':  { anchor: '308',  madeira: '2213' },
  '782':  { anchor: '308',  madeira: '2212' },
  '801':  { anchor: '359',  madeira: '2007' },
  '838':  { anchor: '1088', madeira: '1914' },
  '839':  { anchor: '360',  madeira: '1913' },
  '840':  { anchor: '379',  madeira: '1912' },
  '841':  { anchor: '378',  madeira: '1911' },
  '842':  { anchor: '388',  madeira: '1910' },
  '869':  { anchor: '944',  madeira: '2105' },
  '898':  { anchor: '360',  madeira: '2006' },
  '938':  { anchor: '381',  madeira: '2005' },
  '3022': { anchor: '8581', madeira: '1903' },
  '3023': { anchor: '1040', madeira: '1902' },
  '3024': { anchor: '397',  madeira: '1901' },
  '3031': { anchor: '905',  madeira: '2003' },
  '3032': { anchor: '898',  madeira: '2002' },
  '3033': { anchor: '387',  madeira: '1908' },
  '3045': { anchor: '888',  madeira: '2103' },
  '3046': { anchor: '887',  madeira: '2206' },
  '3047': { anchor: '852',  madeira: '2205' },
  '3371': { anchor: '382',  madeira: '2004' },
  '3772': { anchor: '1007', madeira: '2310' },
  '3773': { anchor: '1008', madeira: '2309' },
  '3774': { anchor: '778',  madeira: '2308' },
  '3776': { anchor: '1048', madeira: '2306' },
  '3777': { anchor: '1015', madeira: '0407' },
  '3778': { anchor: '1013', madeira: '0402' },
  '3781': { anchor: '904',  madeira: '1913' },
  '3782': { anchor: '388',  madeira: '1910' },
  '3790': { anchor: '904',  madeira: '1903' },
  '3826': { anchor: '1049', madeira: '2306' },
  '3827': { anchor: '311',  madeira: '2310' },
  '3828': { anchor: '373',  madeira: '2103' },
  '3829': { anchor: '901',  madeira: '2210' },
  '3859': { anchor: '914',  madeira: '0301' },
  '3862': { anchor: '358',  madeira: '2008' },
  '3863': { anchor: '379',  madeira: '1907' },
  '3864': { anchor: '376',  madeira: '1906' },

  // Grays & blacks
  '03':   { anchor: '397',  madeira: '1809' },
  '310':  { anchor: '403',  madeira: '2400', cosmo: '600', jp_coats: '8403' },
  '317':  { anchor: '400',  madeira: '1714' },
  '318':  { anchor: '399',  madeira: '1802' },
  '413':  { anchor: '401',  madeira: '1713' },
  '414':  { anchor: '235',  madeira: '1801' },
  '415':  { anchor: '398',  madeira: '1803' },
  '535':  { anchor: '401',  madeira: '1809' },
  '644':  { anchor: '830',  madeira: '1907' },
  '648':  { anchor: '900',  madeira: '1814' },
  '712':  { anchor: '926',  madeira: '2101' },
  '762':  { anchor: '234',  madeira: '1804' },
  '822':  { anchor: '390',  madeira: '1908' },
  '844':  { anchor: '1041', madeira: '1810' },
  '928':  { anchor: '274',  madeira: '1709' },
  '3072': { anchor: '847',  madeira: '1805' },
  '3787': { anchor: '904',  madeira: '1811' },
  '3799': { anchor: '236',  madeira: '1713' },
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

// ── Per-brand catalogs ───────────────────────────────────────────────────────

export interface BrandColor {
  /** Brand-specific code, e.g. "9046" for Anchor or "321" for DMC. */
  number: string
  /** Approximate hex — borrowed from the DMC equivalent for non-DMC brands. */
  hex: string
  /** Color name (DMC's name; non-DMC brand names are not in the dataset). */
  name: string
}

const dmcByNumber = new Map<string, DmcColor>(DMC_COLORS.map((c) => [c.number, c]))

const catalogCache: Partial<Record<BrandId, BrandColor[]>> = {}

/**
 * Returns the browseable catalog for a brand. DMC returns the full curated
 * list; other brands return entries derived from the conversion chart, so
 * coverage is limited to colors we have a cross-reference for.
 */
export function catalogFor(brand: BrandId): BrandColor[] {
  if (catalogCache[brand]) return catalogCache[brand]!

  if (brand === 'dmc') {
    catalogCache.dmc = DMC_COLORS.map((c) => ({ number: c.number, hex: c.hex, name: c.name }))
    return catalogCache.dmc
  }

  const seen = new Set<string>()
  const out: BrandColor[] = []
  for (const [dmc, eqs] of Object.entries(CONVERSIONS)) {
    const code = eqs[brand]
    if (!code || seen.has(code)) continue
    const dmcEntry = dmcByNumber.get(dmc)
    if (!dmcEntry) continue
    seen.add(code)
    out.push({ number: code, hex: dmcEntry.hex, name: dmcEntry.name })
  }
  catalogCache[brand] = out
  return out
}

// ── Color request link ──────────────────────────────────────────────────────

const COLOR_REQUEST_REPO = 'jworthen/crossstitcher'

/**
 * Builds a GitHub "new issue" URL with a pre-filled template asking for a
 * missing brand/color in the conversion chart. Opens in the user's browser
 * so they can submit it without leaving Thready.
 */
export function buildColorRequestUrl(opts: { brand?: BrandId; code?: string } = {}): string {
  const brandName = opts.brand ? BRAND_BY_ID[opts.brand].name : ''
  const code = (opts.code ?? '').trim()
  const titleParts = ['Color request']
  if (brandName) titleParts.push(brandName)
  if (code) titleParts.push(code)
  const title = titleParts.join(': ').replace(/: : /, ': ')

  const body = [
    `**Brand:** ${brandName || '(specify)'}`,
    `**Code:** ${code || '(specify)'}`,
    `**DMC equivalent (if known):** `,
    `**Color name (if known):** `,
    ``,
    `Please add this to Thready's conversion chart, or let me know if there's no documented equivalent.`,
  ].join('\n')

  const params = new URLSearchParams({ title, body, labels: 'color-request' })
  return `https://github.com/${COLOR_REQUEST_REPO}/issues/new?${params.toString()}`
}

