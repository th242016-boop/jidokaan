import { requiresPostalCode } from "./address-requirements";
/** Basic typo checks only, not an address existence or customs-clearance guarantee. */
export const POSTAL_EXAMPLES: Record<string,string> = {US:"10001 / 10001-1234",CA:"K1A 0B1",AU:"2000",GB:"SW1A 1AA",JP:"100-0001",CN:"100000",SG:"018956",TH:"10100",PH:"1000",FR:"75001",DE:"10115",ES:"28001",MX:"06000",BR:"01001-000",AR:"C1000ABC",CH:"8001",NL:"1012 AB",SE:"111 22",SA:"12345",IN:"110001",RU:"101000",UZ:"100000",TR:"34000",EG:"11511"};
export const ADDRESS_REGIONS: Record<string, Record<string,string>> = {
  US: Object.fromEntries("AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|DC:District of Columbia|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming".split("|").map(v=>v.split(":"))),
  CA: Object.fromEntries("AB:Alberta|BC:British Columbia|MB:Manitoba|NB:New Brunswick|NL:Newfoundland and Labrador|NS:Nova Scotia|NT:Northwest Territories|NU:Nunavut|ON:Ontario|PE:Prince Edward Island|QC:Quebec|SK:Saskatchewan|YT:Yukon".split("|").map(v=>v.split(":"))),
};
const patterns:Record<string,RegExp>={US:/^\d{5}(-\d{4})?$/,CA:/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,AU:/^\d{4}$/,JP:/^\d{3}-?\d{4}$/,CN:/^\d{6}$/,SG:/^\d{6}$/,TH:/^\d{5}$/,PH:/^\d{4}$/,FR:/^\d{5}$/,DE:/^\d{5}$/,ES:/^\d{5}$/,MX:/^\d{5}$/,BR:/^\d{5}-?\d{3}$/,CH:/^\d{4}$/,NL:/^\d{4}\s?[A-Z]{2}$/i,SE:/^\d{3}\s?\d{2}$/,IN:/^[1-9]\d{5}$/,RU:/^\d{6}$/,UZ:/^\d{6}$/,TR:/^\d{5}$/};
export function validPostalAddress(country:string,postal:string,region:string):boolean {
  const code=country.trim().toUpperCase();
  if (requiresPostalCode(code) && !postal.trim()) return false;
  if (postal.trim() && patterns[code] && !patterns[code].test(postal.trim())) return false;
  const regions=ADDRESS_REGIONS[code];
  if (regions && !Object.entries(regions).some(([key,name])=>key===region.trim().toUpperCase() || name.toLowerCase()===region.trim().toLowerCase())) return false;
  return true;
}
