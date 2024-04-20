const permition = (roles) => (request, response, next) => {
  const { user } = request;
  if (user && roles.some((role) => user.role.includes(role))) {
    next(); // role is allowed, so continue on the next middleware
  } else {
    response.status(403).json({ message: `Forbidden, not ${roles}` }); // user is forbidden
  }
};

module.exports = { permition };
