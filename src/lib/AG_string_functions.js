export function removeStartOfString(str, marker) {
  return str.split(marker).pop();
}

export function removeEndOfString(str, marker) {
  return str.split(marker)[0];
}
