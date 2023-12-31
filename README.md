

## Game states
- Login: User is not yet logged in
- New: User is logged in, but game has not yet started
- Hint: Storyteller gives hint, other users selects cards
- Vote: Users vote on a card
- Score: Scores are presented to the users


## ToDo
[] Add timeout for selecting and voting
[] Improve state representation in UI
[] Generate a bunch of images
[] Serve images from server


## Basics Flow

[x] Server (node + express) that handles and syncs states between clients
[x] Client (vue) displays the game for the users and communicates with the server
[x] Communication between server and client is socket.io

Preparations
    [x] All user receives 6 images
    [x] First user is assigned storyteller other users are called players
One round
    [x] Storyteller select one image
    [x] Storyteller writes a short description and submits
    [x] Players and storyteller sees the storytellers description on screen
    [] Players get 20 seconds to select one of their images
    [x] Users see all selected images, including the storytellers image, in a random order
    [] Players get 20 seconds to select one image
    [x] Players that selected the storytellers image are rewarded three points
    [x] Players are rewarded one point for every other player who selected their picutre
    [x] Storyteller is rewarded three points for every player that selected their picture
    [x] Selected images are removed from game
    [x] All users recives one new image (so they now have 6 images again)
    [x] Next user is assigned the role or storyteller and other users are players
    [x] The round starts over
End of game
    [] The game ends when a user has earned 30 points, this user is the winner