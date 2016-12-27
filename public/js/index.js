const SERVER_URL = "https://www.duedue.xyz:8080";
const RECORDING_INTERVAL = 15000; //ms
//check the browser
detectSafari();
//initialize the audio
initAudio();

//the button to launch the recording
jQuery( document ).ready(function() {
    jQuery(".hint").hide();
    jQuery(".ball_container").hide(); 
    jQuery("#save").hide();
});

function uploadBlob(blob){
    var reader = new window.FileReader();
        reader.readAsDataURL(blob); 
        reader.onloadend = function() {
            base64data = this.result;
            base64data=base64data.substr(base64data.indexOf(',')+1)
            request(base64data);                
        }
    doneEncoding(blob);
}

function request(base64data){
    //send the data
    var oReq = new XMLHttpRequest();
    oReq.open("POST", SERVER_URL, true);
    oReq.onload = function (oEvent) {
      // Uploaded.
      console.log("uploaded");
    };
    oReq.send(base64data);
    //write the text to the box
    oReq.onreadystatechange = function() {
        if (oReq.readyState == XMLHttpRequest.DONE) {
            var txt = oReq.responseText;
            console.log(txt);
            var original = jQuery('#main_txt').val();
            var new_txt = txt + original;
            jQuery('#main_txt').val(new_txt);
            jQuery(".hint").hide();
            jQuery(".ball_container").hide();
        }
    }
}

//the following code is attributed to Chris Wilson
/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;

/* TODO:

- offer mono option
- "Monitor input" switch
*/

function saveAudio() {
    //audioRecorder.exportWAV( doneEncoding );
    // could get mono instead by saying
    // audioRecorder.exportMonoWAV( doneEncoding );
}

function gotBuffers( buffers ) {
    //var canvas = document.getElementById( "wavedisplay" );

    //drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );

    // the ONLY time gotBuffers is called is right after a new recording is completed - 
    // so here's where we should set up the download.
    //audioRecorder.exportWAV( doneEncoding );
}

function doneEncoding( blob ) {
    Recorder.setupDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav" );
    recIndex++;
}

function toggleRecording( e ) {
    if (e.classList.contains("recording")) {
        // stop recording
        audioRecorder.stop();
        e.classList.remove("recording");
        //upload the audio to server
        audioRecorder.exportMonoWAV( uploadBlob );
        //download the audio
        //audioRecorder.getBuffers( gotBuffers );
        //audioRecorder.exportWAV( doneEncoding );
        e.innerHTML = "Voice to Text";
        jQuery(".hint").html("Processing... (Longer Recording results in Longer Wait time)");
        jQuery("#save").show();
    } else {
        // start recording
        if (!audioRecorder)
            return;
        e.classList.add("recording");
        e.innerHTML = "STOP";
        jQuery(".hint").html("Recording... Click Stop to Transcribe");
        jQuery(".hint").show();
        jQuery(".ball_container").show();
        jQuery("#save").hide();
        audioRecorder.clear();
        audioRecorder.record();
    }
}

function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

function cancelAnalyserUpdates() {
    window.cancelAnimationFrame( rafID );
    rafID = null;
}

function updateAnalysers(time) {
    
    if (!analyserContext) {
        var canvas = document.getElementById("analyser");
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        analyserContext = canvas.getContext('2d');
    }

    // analyzer draw code here
    {
        var SPACING = 3;
        var BAR_WIDTH = 1;
        var numBars = Math.round(canvasWidth / SPACING);
        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

        analyserNode.getByteFrequencyData(freqByteData); 

        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        analyserContext.fillStyle = '#F6D565';
        analyserContext.lineCap = 'round';
        var multiplier = analyserNode.frequencyBinCount / numBars;

        // Draw rectangle for each frequency bin.
        for (var i = 0; i < numBars; ++i) {
            var magnitude = 0;
            var offset = Math.floor( i * multiplier );
            // gotta sum/average the block, or we miss narrow-bandwidth spikes
            for (var j = 0; j< multiplier; j++)
                magnitude += freqByteData[offset + j];
            magnitude = magnitude / multiplier;
            var magnitude2 = freqByteData[i * multiplier];
            analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
            analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
        }
    }
    
    rafID = window.requestAnimationFrame( updateAnalysers );

}

function toggleMono() {
    if (audioInput != realAudioInput) {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput = realAudioInput;
    } else {
        realAudioInput.disconnect();
        audioInput = convertToMono( realAudioInput );
    }

    audioInput.connect(inputPoint);
}

function gotStream(stream) {
    inputPoint = audioContext.createGain();

    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

//    audioInput = convertToMono( input );

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect( analyserNode );

    audioRecorder = new Recorder( inputPoint );

    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
    updateAnalysers();
}

function initAudio() {
    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.getUserMedia ||
                                 navigator.webkitGetUserMedia ||
                                 navigator.mozGetUserMedia ||
                                 navigator.msGetUserMedia;
    if (!navigator.cancelAnimationFrame)
        navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    if (!navigator.requestAnimationFrame)
        navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, function(e) {
            var r = confirm("We currently do not support your browser. Please download Chrome from App Store. (我们暂时不支持微信浏览器, 请于App Store下载Chrome)");
            var ua = navigator.userAgent.toLowerCase();
            var isAndroid = ua.indexOf("android") > -1;
            if (r == true) {
                if (!isAndroid)
                    window.location.replace("https://itunes.apple.com/us/app/chrome/id535886823");
                else 
                    window.location.replace("https://play.google.com/store/apps/details?id=com.android.chrome&pcampaignid=website");
            } else {
                if (!isAndroid)
                    window.location.replace("https://itunes.apple.com/us/app/chrome/id535886823");
                else 
                    window.location.replace("https://play.google.com/store/apps/details?id=com.android.chrome&pcampaignid=website");
            }
        });
}

function printObject(o) {
  var out = '';
  for (var p in o) {
    out += p + ': ' + o[p] + '\n';
  }
  alert(out);
}

//since safari is currently not supported, we want to tell the user to download chrome
function detectSafari(){
    if (navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0) 
    {
        var r = confirm("We currently do not support Safari. Please download Chrome from App Store.");
        var ua = navigator.userAgent.toLowerCase();
        var isAndroid = ua.indexOf("android") > -1;
        if (r == true) {
            if (!isAndroid)
                window.location.replace("https://itunes.apple.com/us/app/chrome/id535886823");
            else 
                window.location.replace("https://play.google.com/store/apps/details?id=com.android.chrome&pcampaignid=website");
        } else {
            if (!isAndroid)
                window.location.replace("https://itunes.apple.com/us/app/chrome/id535886823");
            else 
                window.location.replace("https://play.google.com/store/apps/details?id=com.android.chrome&pcampaignid=website");
        }
    }
}

