export function in_array_replace_A_with_B(arry, elemntA, elemntB) {
  // Example: in_array_replace_A_with_B(['q','w','r','t'], 'w', 'e') => ['q','e','r','t']
  let position = arry.indexOf(elemntA) + 1;
  if (position > 0) {
    return arry.slice(0, position - 1).concat(elemntB, arry.slice(position));
  }
  return arry;
}

export function in_array_after_A_insert_B(arry, elemntA, elemntB) {
  // Example: in_array_after_A_insert_B(['q','w','r','t'], 'w', 'e') => ['q','w','e','r','t']
  let position = arry.indexOf(elemntA) + 1;
  if (position > 0) {
    return arry.slice(0, position).concat(elemntB, arry.slice(position));
  }
  return arry;
}
