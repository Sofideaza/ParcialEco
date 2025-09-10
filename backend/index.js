const express = require("express")
const path = require("path")
const db = require("./db-util")

const app = express()
app.use(express.json())

app.use("/players-app", express.static(path.join(__dirname, "players_app")))
app.use("/monitor-app", express.static(path.join(__dirname, "monitor_app")))

app.post("/users/register", (req, res) => {
  try {
    const { name } = req.body
    
    if (!name) {
      return res.status(400).json({ error: "el nombre es obligatorio" })
    }

    const users = db.load("users")
    const userExists = users.find(user => user.name === name)
    
    if (userExists) {
      return res.status(409).json({ error: "el nombre de usuario ya existe" })
    }

    const newUser = {
      id: users.length + 1,
      name,
      balance: 1000,
      bids: []
    }

    users.push(newUser)
    db.save("users", users)

    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      balance: newUser.balance
    })
  } catch (error) {
    res.status(500).json({ error: "error del servidor" })
  }
})

app.get("/items", (req, res) => {
  try {
    const items = db.load("items")
    const sort = req.query.sort

    if (sort === "highestBid") {
      items.sort((a, b) => b.highestBid - a.highestBid)
    }

    res.status(200).json(items)
  } catch (error) {
    res.status(500).json({ error: "error del servidor al obtener los items" })
  }
})

app.post("/items/:id/bid", (req, res) => {
  try {
    const itemId = parseInt(req.params.id)
    const { userId, amount } = req.body

    const auction = db.load("auction")
    if (!auction.isOpen) {
      return res.status(403).json({ error: "la subasta está cerrada" })
    }

    const items = db.load("items")
    const item = items.find(item => item.id === itemId)
    if (!item) {
      return res.status(404).json({ error: "item no encontrado" })
    }

    const users = db.load("users")
    const user = users.find(user => user.id === userId)
    if (!user) {
      return res.status(404).json({ error: "usuario no encontrado" })
    }

    if (amount <= item.highestBid) {
      return res.status(400).json({ error: "la oferta debe ser mayor a la actual" })
    }

    const totalReserved = user.bids.reduce((sum, bid) => sum + bid.amount, 0)
    const availableBalance = user.balance - totalReserved
    
    if (amount > availableBalance) {
      return res.status(400).json({ error: "saldo insuficiente" })
    }

    item.highestBid = amount
    item.highestBidder = user.name

    const userBidIndex = user.bids.findIndex(bid => bid.itemId === itemId)
    if (userBidIndex !== -1) {
      user.bids[userBidIndex].amount = amount
    } else {
      user.bids.push({ itemId, amount })
    }

    db.save("items", items)
    db.save("users", users)

    res.status(200).json({
      itemId: item.id,
      highestBid: item.highestBid,
      highestBidder: item.highestBidder
    })
  } catch (error) {
    res.status(500).json({ error: "error del servidor" })
  }
})

app.get("/users/:id", (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const users = db.load("users")
    const user = users.find(user => user.id === userId)

    if (!user) {
      return res.status(404).json({ error: "usuario no encontrado" })
    }

    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: "error del servidor" })
  }
})

app.post("/auction/openAll", (req, res) => {
  try {
    const auction = db.load("auction")
    
    if (auction.isOpen) {
      return res.status(400).json({ error: "la subasta ya está abierta" })
    }

    auction.isOpen = true
    auction.endTime = new Date(Date.now() + 60000).toISOString()
    
    db.save("auction", auction)

    res.status(200).json({
      auction: "abierta",
      startTime: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: "no se pudo abrir la subasta" })
  }
})

app.post("/auction/closeAll", (req, res) => {
  try {
    const auction = db.load("auction")
    
    if (!auction.isOpen) {
      return res.status(400).json({ error: "la subasta ya está cerrada" })
    }

    auction.isOpen = false
    db.save("auction", auction)

    const items = db.load("items")
    const users = db.load("users")
    const results = []

    for (const item of items) {
      if (item.highestBidder) {
        item.sold = true
        const winner = users.find(user => user.name === item.highestBidder)
        if (winner) {
          winner.balance -= item.highestBid

          winner.bids = winner.bids.filter(bid => bid.itemId !== item.id)
        }
        
        results.push({
          itemId: item.id,
          item: item.name,
          winner: item.highestBidder,
          finalBid: item.highestBid
        })
      }
    }

    db.save("items", items)
    db.save("users", users)

    res.status(200).json({
      auction: "cerrada",
      results
    })
  } catch (error) {
    res.status(500).json({ error: "no se pudo cerrar la subasta" })
  }
})

app.listen(5080, () => {
  console.log("Server is running on http://localhost:5080")
})