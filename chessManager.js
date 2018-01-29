var games = {}
exports.startGame = (p1, p2) => {
    var gameId = generateId()
    games[gameId] = (getNewBoard(p1, p2))
    return gameId
}

exports.movePiece = ({ gameId, moveTo, moveFrom }) => {
    var pieceToMove = games[gameId].board[moveFrom]
    games[gameId].board[moveTo] = pieceToMove
    games[gameId].board[moveFrom] = 'empty'
    // console.log(games[gameId].board)
    console.log('moving', pieceToMove, 'from', moveFrom, 'to', moveTo)
    if (games[gameId].currTurn === 'white') {
        games[gameId].currTurn = 'black'
        sessionIdToUpdate = games[gameId].p2.sessionId
    } else {
        games[gameId].currTurn = 'white'
        sessionIdToUpdate = games[gameId].p1.sessionId
    }

    return sessionIdToUpdate
}

function generateId() {
    return Date.now()
}
function getNewBoard(p1SessionId, p2SessionId) {
    var game = {
        p1: { sessionId: p1SessionId, color: 'white' },
        p2: { sessionId: p2SessionId, color: 'black' },
        currTurn: 'white',
        board: {}
    };
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            var piece = getPieceLoc(i, j)
            game.board[i + '-' + j] = piece
        }
    }
    return game
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
    }
    else if (i === 1) {
        piece = 'white-pawn'
    }
    else if (i === 7) {
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
    }
    else if (i === 6) piece = 'black-pawn'

    else piece = 'empty'

    return piece
}