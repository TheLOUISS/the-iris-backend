const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const protect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401);
      throw new Error("Sem autorização, por favor faça login");
    }

    // Verificando o Token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    // Pegando o usuario pelo ID
    const user = await User.findById(verified.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("Usuário não encontrado");
    }

    // Configurações do cookie
    const cookieOptions = {
      secure: true, // Só enviar o cookie através de HTTPS
      httpOnly: true, // O cookie só pode ser acessado pelo servidor
      sameSite: "strict", // Restringe o envio do cookie para requisições do mesmo site
      // maxAge: 3600000, // opcional: define a duração do cookie em milissegundos
    };

    // Definir o cookie
    res.cookie("token", token, cookieOptions);

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Sem autorização!");
  }
});

module.exports = protect;
