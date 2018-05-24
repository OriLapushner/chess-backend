games = {}

exports.startGame = (p1Socket, p2Socket) => {
    var gameId = generateId()
    // console.log('initial p1Socket value: ',p1Socket)
    games[gameId] = {
        board: getNewBoard(),
        p1: {
            socket: p1Socket,
            color: 'white',
        },
        p2: {
            socket: p2Socket,
            color: 'black',
        },
        currTurn: 'white',
    }
    return gameId + ''
}

exports.getSockets = gameId => {
    if (!games[gameId]) console.log('game cannot be found')
    // return { p1Sockt: games[gameId].p1.socket, p2Socket: games[gameId].p2.socket }
    var sockets = {
        p1: games[gameId].p1.socket,
        p2: games[gameId].p2.socket
    }
    return sockets
}
exports.movePiece = ({
    gameId,
    moveTo,
    moveFrom
}) => {
    var pieceToMove = games[gameId].board[moveFrom]
    var socketToUpdate
    games[gameId].board[moveTo] = pieceToMove
    games[gameId].board[moveFrom] = 'empty'
    // console.log(games[gameId].board)
    console.log('moving', pieceToMove, 'from', moveFrom, 'to', moveTo)
    if (games[gameId].currTurn === 'white') {
        games[gameId].currTurn = 'black'
        socketToUpdate = games[gameId].p1.socket
    } else {
        games[gameId].currTurn = 'white'
        socketToUpdate = games[gameId].p2.socket
    }

    return socketToUpdate
}

exports.cleanGames = (socketId) => {
    // console.log('games active before cleanup: ', games)
    for (var game in games) {
        if (socketId === games[game].p1.socket.id ||
            socketId === games[game].p2.socket.id) delete games[game]
    }
    // console.log('games active after cleanup: ', games)
}

function generateId() {
    return Math.floor(Math.random() * 10000)
}

function getNewBoard() {

    var board = {}
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            var piece = getPieceLoc(i, j)
            board[i + '-' + j] = piece
        }
    }
    return board
}

function getPieceLoc(i, j) {
    var piece;
    if (i === 0) {
        switch (j) {
            case 0:
            case 7:
                piece = 'white-rook'
                break;
            case 1:
            case 6:
                piece = 'white-knight'
                break;
            case 2:
            case 5:
                piece = 'white-bishop'
                break;
            case 3:
                piece = 'white-queen'
                break;
            case 4:
                piece = 'white-king'
                break;

            default:
                break;
        }
    } else if (i === 1) {
        piece = 'white-pawn'
    } else if (i === 7) {
        switch (j) {
            case 0:
            case 7:
                piece = 'black-rook'
                break;
            case 1:
            case 6:
                piece = 'black-knight'
                break;
            case 2:
            case 5:
                piece = 'black-bishop'
                break;
            case 3:
                piece = 'black-queen'
                break;
            case 4:
                piece = 'black-king'
                break;

            default:
                break;
        }
    } else if (i === 6) piece = 'black-pawn'

    else piece = 'empty'

    return piece
}