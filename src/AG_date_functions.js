export function currentYYMMDD() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yy = today.getFullYear() - 2000; //Assuming between the years 2000 and 2099
  return yy + mm + dd;
}
