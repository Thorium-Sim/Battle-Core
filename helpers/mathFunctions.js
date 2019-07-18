module.exports.distance = function(x1, y1, x2, y2) {
  var xs = x2 - x1,
    ys = y2 - y1;
  xs *= xs;
  ys *= ys;
  return Math.sqrt(xs + ys);
};

module.exports.vectorAdd = function(theta_1, radius_1, theta_2, radius_2) {
  theta = theta_1 + Math.atan2(radius_2 * Math.sin(theta_2 - theta_1), radius_1 + radius_2 * Math.cos(theta_2 - theta_1))
  radius = Math.sqrt(radius_1 ^ 2 + radius_2 ^ 2 + 2 * radius_1 * radius_2 * Math.cos(theta_2 - theta_1))
  return {
    "theta": theta,
    "radius": radius
  }
}

module.exports.find_angle = function(A, B, C) { //Returns in radians
  var AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
  var BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
  var AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
  return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
}

module.exports.radianToDegree = function(radian) {
  return radian*180/Math.PI
}