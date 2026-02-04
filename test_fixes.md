# Drawlio Bug Fixes - Test Checklist

## ✅ Fixed Issues:

### 1. Overlay Placeholder Issue

- **Problem**: Non-drawers saw "Waiting for your turn to draw" even when they could see the drawing
- **Fix**: Changed overlay opacity to 0 for non-drawers
- **Test**: Non-drawers should see the drawing clearly without any placeholder text

### 2. Word Display Issue

- **Problem**: All players could see the word to draw
- **Fix**: Word only shows in GameHeader for the current drawer
- **Test**: Only the drawer should see the word, other players should not

### 3. Drawer Guessing Prevention (Frontend)

- **Problem**: Drawer could guess their own drawing
- **Fix**: Chat input disabled for drawer with helpful message
- **Test**: Drawer should see "You're drawing! Others will guess your word." and input should be disabled

### 4. Game Initialization

- **Problem**: Game didn't start properly when host clicked "Start Game"
- **Fix**: Added GameStarted event handler in GameRoom
- **Test**: Game should start when host clicks "Start Game" button

## 🔧 Still Need to Fix:

### 1. Timer Starting at 0

- **Problem**: Timer starts at 0 seconds instead of configured duration
- **Fix**: Implemented game state sync for joining/reconnecting players in `joinGameRoom` handler. Now calculates remaining time and sends `NewTurn` event on join.
- **Test**: Join an active game with a second window/browser. The timer should show the correct remaining time.

### 2. Backend Drawer Prevention

- **Problem**: Drawer can still send guesses through backend API
- **Fix**: Added validation in `sendGuess` handler to check if the sender is the current drawer.
- **Test**: As drawer, try to send the correct word in chat. It should be ignored by the backend (no score, no success message).

## 🧪 Testing Instructions:

1. **Start both servers** (backend and frontend)
2. **Create a room** and have multiple players join
3. **Start the game** - should see "Game started!" message
4. **Check timer** - should start at configured duration (e.g., 60 seconds)
5. **Check word display** - only drawer should see the word
6. **Check chat** - drawer should have disabled input
7. **Check drawing** - all players should see real-time drawing
8. **Test guessing** - non-drawers should be able to guess, drawer should not

## 🐛 Known Issues:

- Timer may still start at 0 seconds
- Backend doesn't prevent drawer from guessing (though frontend does)
