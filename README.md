[] Server (node + express) that handles and syncs states between clients
[] Client (vue + pinia) displays the game for the users and communicates with the server
[] Communication between server and client is socket.io

Preparations
    [] All user receives 6 images
    [] First user is assigned storyteller other users are called players
One round
    [] Storyteller select one image
    [] Storyteller writes a short description and submits
    [] Players and storyteller sees the storytellers description on screen
    [] Players get 20 seconds to select one of their images
    [] Users see all selected images, including the storytellers image, in a random order
    [] Players get 20 seconds to select one image
    [] Players that selected the storytellers image are rewarded three points
    [] Players are rewarded one point for every other player who selected their picutre
    [] Storyteller is rewarded three points for every player that selected their picture
    [] Selected images are removed from game
    [] All users recives one new image (so they now have 6 images again)
    [] Next user is assigned the role or storyteller and other users are players
    [] The round starts over
End of game
    [] The game ends when a user has earned 30 points, this user is the winner