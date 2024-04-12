const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const generateToken = (id) => {
  return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "1d"})
}

const registerUser = asyncHandler( async (req, res) => {
  const { name, email, password } = req.body;

  //Validação
  if (!name || !email || !password) {
      res.status(400)
      throw new Error("Por favor, preencha todos os campos obrigatórios!")
  }
  if(password.length < 6) {
    res.status(400)
    throw new Error("A senha precisa ter no minimo 6 caracteres")
  }

  //Verificando se o usuario ja existe
  const userExists = await User.findOne({email})

  if(userExists) {
    res.status(400)
    throw new Error("Email ja cadastrado!")
  }

  //Criando novo usuario
  const user = await User.create({
    name,
    email,
    password,
  });

  //Gerando o token
  const token = generateToken(user._id);

  //Enviando HTTP-Only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), //1 Dia
    sameSite: "none",
    secure: true,
  });

  if (user) {
    const {_id, name, email, photo, phone, bio} = user
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone, 
      bio, 
      token
    });
  } else {
    res.status(400)
    throw new Error("Dados do usuario invalido")
  }
});

//Login do Usuario
const loginUser = asyncHandler( async (req, res) => {
  const { email, password } = req.body
  //Validação da request
  if (!email || !password) {
    res.status(400);
    throw new Error("Por favor, adicione email e senha!");
  }

  //Checando se o usuario existe
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("Usuário não encontrado!");
  }

  //Caso o usuario existe, verificar se a senha é a correta
  const passwordIsCorrect = await bcrypt.compare(password, user.password);
  //Gerando o token
  const token = generateToken(user._id);

  if (passwordIsCorrect) {
    //Enviando HTTP-Only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), //1 Dia
      sameSite: "none",
      secure: true,
    });
  }

  if (user && passwordIsCorrect) {
    const {_id, name, email, photo, phone, bio} = user
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone, 
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Email ou senha invalido");
  }
});

  //Logout
  const logout = asyncHandler (async (req, res) => {
    res.cookie("token", "", {
      path: "/",
      httpOnly: true,
      expires: new Date(0),
      sameSite: "none",
      secure: true,
    });
    return res.status(200).json({ message: "Usuário quitou"})
  });

  //Pegando dados do usuario
  const getUser = asyncHandler ( async (req, res) => {
    const user = await User.findById(req.user._id)

    if (user) {
      const {_id, name, email, photo, phone, bio} = user
      res.status(200).json({
        _id,
        name,
        email,
        photo,
        phone, 
        bio, 
      });
    } else {
      res.status(400)
      throw new Error("Usuário não encontrado")
    }
  });

  //Pegando o status do login
  const loginStatus = asyncHandler (async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
      return res.json(false);
    }

    //Verificando o token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified) {
      return res.json(true)
    }
    return res.json(false)
  });

  //Atualizando o usuário
  const updateUser = asyncHandler (async (req, res) => {
    const user = await User.findById(req.user._id)

    if (user) {
      const { name, email, photo, phone, bio} = user;
      user.email = email;
      user.name = req.body.name || name;
      user.phone = req.body.phone || phone;
      user.bio = req.body.bio || bio;
      user.photo = req.body.photo || photo;

      const updateUser = await user.save()
      res.status(200).json({
        _id: updateUser._id,
        name: updateUser.name,
        email: updateUser.email,
        photo: updateUser.photo,
        phone: updateUser.phone, 
        bio: updateUser.bio, 
      })
    } else {
      res.status(404)
      throw new Error("Usuário não encontrado!")
    }
  });

  const changePassword = asyncHandler (async (req, res) => {
    const user = await User.findById(req.user._id);
    const {oldPassword, password} = req.body;

    if(!user) {
      res.status(400)
      throw new Error("Usuário não encontrado, por favor faça o login!");
    }

    //Validação
    if(!oldPassword || !password) {
      res.status(400)
      throw new Error("Por favor, preencha o campo de antiga e nova senha!");
    }

    //Checando se a senha antiga é a mesma do DB.
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

    //Salvando a nova senha
    if (user && passwordIsCorrect) {
      user.password = password;
      await user.save()
      res.status(200).send("A senha foi alterada com sucesso!");
    } else {
      res.status(400)
      throw new Error("A senha antiga esta incorreta!")
    }
  });

  const forgotPassword = asyncHandler (async (req, res) => {
      const {email} = req.body
      const user = await User.findOne({email})

      if(!user) {
        res.status(404)
        throw new Error("Usuário não existe!")
      }

      //Deletando o token se o mesmo existir no BD
      let token = await Token.findOne({ userId: user._id })
      if (token) {
        await token.deleteOne();
      }

      //Criando um token descartavel
      let resetToken = crypto.randomBytes(32).toString("hex") + user._id

      //Adicionando hash no token antes de salvar no DB
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")
      
      //Salvando o token no DB
      await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60 * 1000) // 30 minutos
      }).save()

      //Construindo uma URL de Reset
      const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

      //Reset Email
      const message = `
      <h2>Olá, ${user.name}</h2>
      <p>Por favor use o link abaixo para redefinir sua senha</p>
      <p>Este link é valido por apenas 30 minutos</p>

      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

      <p>Até mais...</p>
      <p>Equipe Irís</p>
      `;

      const subject = "Pedido para mudar de senha"
      const send_to = user.email
      const sent_from = process.env.EMAIL_USER

      try {
        await sendEmail(subject, message, send_to, sent_from)
        res.status(200).json({
          sucess: true,
          message: "Email enviado"
        })
      } catch (error) {
        res.status(500)
        throw new Error("Email não enviado, por favor tente novamente.")
      }
  });

  const resetPassword = asyncHandler ( async (req, res) => {
      const { password } = req.body
      const { resetToken } = req.params

      //Adicionando hash no token, para comparar com o Token no DB
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

      //Encontrando o token no DB
      const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt: {$gt: Date.now()}
      });

      if(!userToken) {
        res.status(404);
        throw new Error("Token invalido ou expirado")
      }

      //Encontrando o usuario
      const user = await User.findOne({_id: userToken.userId})
      user.password = password;
      await user.save()
      res.status(200).json({
        message: "Senha alterada com sucesso! Por favor faça o login."
      })
  })

module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
}