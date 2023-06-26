import mongoose from "mongoose";
import express from 'express';
import cors from 'cors'
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

mongoose.connect('mongodb+srv://bot:4irvrSnqviI707AK@cluster0.8ijfr7u.mongodb.net/mydatabase?retryWrites=true&w=majority')
  .then(() => {
    console.log('Conectado ao MongoDB');
  })
  .catch((error) => {
    console.error('Erro ao conectar ao MongoDB:', error);
  });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  }, senha: {
    type: String,
    required: true
  }
});

const User = mongoose.model('users', userSchema);
const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cors())
app.listen(port, () => {
  console.log(`Rodando na porta ${port}`);
});

function hash(password) {
  const sal = randomBytes(16).toString('hex');

  const passwordWithHash = scryptSync(password, sal, 16).toString('hex');

  return `${sal}:${passwordWithHash}`
}

function compareHash(password, passwordHashed) {
  const [salt, passwordHash] = passwordHashed.split(':');

  const compareHashBuffer = scryptSync(password, salt, 16);
  const hashBuffer = Buffer.from(passwordHash, 'hex');

  return timingSafeEqual(hashBuffer, compareHashBuffer);
}

app.get('/', (req, res) => {
  res.status(200).send({ mensagem: 'oi' });
});

app.post('/users', async (req, res) => {
  const { name, senha } = req.body

  User.schema.path('name').validate(async function (value) {
    const user = await User.findOne({ name: value });

    return !user
  }, "nome já está em uso");

  try {
    const passwordHash = await hash(senha)

    await User.create({
      name, senha: passwordHash
    })

    res.status(201).send('Usuário cadastrado com sucesso');
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/users/login', async (req, res) => {
  const { name, senha } = req.body;

  try {
    const user = await User.findOne({ name })

    const comparePassword = compareHash(senha, user.senha);

    if (comparePassword) {
      res.status(200).send({
        message: "Usuário autenticado",
        authentication: true
      })
    } else {
      res.status(400).send({
        message: "Senha incorreta",
        authentication: false
      })
    }
  } catch (error) {
    return res.status(500).json(error)
    }
  }
)

app.get('/users', async (req, res) => {
  try {
    const usuario = await User.find()

    return res.status(200).json(usuario)
  } catch (error) {
    res.status(500).send(error)
  }
}
)

app.get('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await User.findById(id)

    return res.status(200).json(usuario)
  } catch (error) {
    return res.status(500).json(error)
  }
}
)

app.put('/users/:id', async (req, res) => {
  const { id } = req.params
  const informacoes = req.body;

  try {
    await User.findByIdAndUpdate(id, informacoes)

    return res.status(200).json({ mensagem: 'ok' })
  } catch (error) {
    return res.status(500).json(error)
  }
})

app.delete(('/users/id', async (req, res) => {
  const { id } = req.params;

  try {
    await User.findByIdAndDelete(id)

    return res.status(200).json({ mensagem: 'deletado' })
  } catch (error) {
    return res.status(500).json(error)
  }
}))
