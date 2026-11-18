/** Do not infer accessory dimensions from the one-pair boxing-shoe box. */
export type ShippingItem = { qty: number; category?: string; customizable?: boolean; shape?: string };
export function parcelPlan(items: ShippingItem[]) {
  const shoes=items.filter(item => item.category === "custom" || item.category === "ready" || item.customizable === true);
  const valid=items.length>0 && items.every(item=>Number.isInteger(item.qty)&&item.qty>0);
  return { shoePairs:shoes.reduce((sum,item)=>sum+item.qty,0), hasShoes:shoes.length>0,
    requiresQuote:!valid || shoes.length!==items.length };
}
