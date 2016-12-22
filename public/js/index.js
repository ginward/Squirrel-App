const INPUT_BUFFER_LENGTH = 4096;
const OUTPUT_BUFFER_LENGTH = 100000;
const OUTPUT_SAMPLE_RATE = 16000; //Unit: Hz
const SERVER_URL = "http://localhost:8080";
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
var config = {
	inputBufferLength: INPUT_BUFFER_LENGTH,
	outputBufferLength: OUTPUT_BUFFER_LENGTH, 
	outputSampleRate: OUTPUT_SAMPLE_RATE
};
//Callback once the user authorizes access to the microphone:
function startUserMedia(stream) {
    var input = audioContext.createMediaStreamSource(stream);
    recorder = new AudioRecorder(input, config);
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
		//send the data
		var oReq = new XMLHttpRequest();
		oReq.open("POST", SERVER_URL, true);
		oReq.onload = function (oEvent) {
		  // Uploaded.
		  console.log("uploaded");
		};
		var wav = packageWAV(data);
		console.log(wav);
		var blob = new Blob ([wav], {type:'audio/wav'});
		oReq.send(blob);
	}
}

//function to package WAV data
function packageWAV(data){
	//the buffer is used to create the WAV file
	var buffer = new ArrayBuffer(44+data.length*2);
	var view = new DataView(buffer);
	//write the WAV container 
	//RIFF chunk descriptor 
	writeUTFBytes(view, 0, "RIFF");
	view.setUint32(4, 44+data.length*2, true);
	writeUTFBytes(view, 8, 'WAVE');
	//FMT sub-chunk
	writeUTFBytes(view, 12, 'fmt');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	//stereo (2 channels)
	view.setUint16(22, 2, true);
	view.setUint32(24, OUTPUT_SAMPLE_RATE, true);
	view.setUint32(28, OUTPUT_SAMPLE_RATE * 4, true);
	view.setUint16(32, 4, true);
	view.setUint16(34, 16, true);
	//data sub chunk
	writeUTFBytes(view, 36, 'data');
	view.setUint32(40, data.length*2, true);

	//write the PCM samples
	var lng = data.length; 
	var index = 44; 
	var volume = 1; 
	for (var i=0;i<lng;i++){
		view.setInt16(index, data[i] *  (0x7FFF * volume), true);
		index+=2;
	}
	return view; 
}

function writeUTFBytes(view, offset, string){
	var lng = string.length;
	for (var i=0; i<lng; i++){
		view.setUint8(offset+i, string.charCodeAt(i));
	}
}