import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/books'
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

const Author = mongoose.model('Author', {
  name: String,
})

const Book = mongoose.model('Book', {
  title: String,
  // this author property of the Book, relates to 'Author' models ID
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
  },
})

// if RESET_DATABASE=true
if (process.env.RESET_DATABASE) {
  console.log('Resetting database!')
  const seedDatabase = async () => {
    // start by deleting the data,
    // but on the other hand each author receive a new id after each reset
    await Author.deleteMany()
    await Book.deleteMany()

    const tolkien = new Author({ name: 'J.R.R. Tolkien' })
    await tolkien.save()

    const rowling = new Author({ name: 'J.K. Rowling' })
    await rowling.save()

    await new Book({
      title: "Harry Potter and the Philosopher's Stone",
      author: rowling,
    }).save()
    await new Book({
      title: 'Harry Potter and the Chamber of Secrets',
      author: rowling,
    }).save()
    await new Book({ title: 'The Lord of the Rings', author: tolkien }).save()
    await new Book({ title: 'The Hobbit', author: tolkien }).save()
  }

  seedDatabase()
}

// Defines the port the app will run on. Defaults to 8080, but can be
// overridden when starting the server. For example:
//
//   PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(bodyParser.json())

// unreachable database -> status 503
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: 'Service unavailable' })
  }
})

// Start defining your routes here
app.get('/', (req, res) => {
  res.send('Hello world')
})

app.get('/authors', async (req, res) => {
  const authors = await Author.find()
  res.json(authors)
})

app.get('/authors/:id', async (req, res) => {
  try {
    const author = await Author.findById(req.params.id)

    if (author) {
      res.json(author)
    } else {
      res.status(404).json({ error: 'Author not found' })
    }
  } catch (err) {
    res.status(404).json({ error: 'Invalid author id' })
  }
})

app.get('/authors/:id/books', async (req, res) => {
  try {
    const author = await Author.findById(req.params.id)
    if (author) {
      const books = await Book.find({
        author: mongoose.Types.ObjectId(author.id),
      })
      res.json(books)
    } else {
      res.status(404).json({ error: 'Author not found' })
    }
  } catch (err) {
    res.status(404).json({ error: 'Invalid author id' })
  }
})

// get null??
app.get('/books', async (req, res) => {
  const books = await Book.find().populate('author')
  res.json(books)
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
