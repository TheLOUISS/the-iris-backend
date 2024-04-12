const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
    name: {
      type: String,
      required: [true, "Por favor, adicione um nome!"]
    },
    email: {
      type: String,
      required: [true, "Por favor, adicione um e-mail!"],
      unique: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Por favor, entre com um e-mail valido!"
      ]
    },
    password: {
      type: String,
      required: [true, "Por favor, adicione uma senha!"],
      minLength: [6, "A senha precisa ter no minimo 6 caracteres"],
      //maxLenght: [23, "A senha não pode ter mais do que 23 caracteres"],
    },
    photo: {
      type: String,
      required: [true, "Por favor, adicione uma foto!"],
      default: "https://i.ibb.co/4pDNDk1/avatar.png"
    },
    phone: {
      type: String,
      default: "+234"
    },
    bio: {
      type: String,
      maxLenght: [250, "A biografia não pode ter mais do que 250 caracteres"],
      default: "bio"
    },
  },  
  {
    timestamps: true,
  }
);

  //Encripitando a senha antes de salvar no DB
  userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) {
      return next()
    }
    //Senha com hash
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(this.password, salt)
    this.password = hashedPassword;
    next()
  })
  
const User = mongoose.model("User", userSchema)
module.exports = User