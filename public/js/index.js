// Deal with prefixed APIs
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia;

// Instantiating AudioContext
try {
    var audioContext = new AudioContext();
} catch (e) {
    console.log("Error initializing Web Audio");
}

var recorder;
//Callback once the user authorizes access to the microphone:
function startUserMedia(stream) {
    var input = audioContext.createMediaStreamSource(stream);
    recorder = new AudioRecorder(input);
    // We can, for instance, add a recognizer as consumer
    if (recognizer) recorder.consumers.push(recognizer);
    recorder.start();
};


//the button to launch the recording
jQuery( document ).ready(function() {
	jQuery("#record").click(function(){
		// Actually call getUserMedia
		if (navigator.getUserMedia)
		    navigator.getUserMedia({audio: true},
		                           startUserMedia,
		                           function(e) {console.log("No live audio input in this browser");}
		                          );
		else console.log("No web audio support in this browser");
	});
});

var recognizer = {};

//the consumer that parse the audio data
recognizer.postMessage=function(cmd){
	if(cmd.command=="process"){
		var data = cmd.data;
		//process the data
		
	}
}