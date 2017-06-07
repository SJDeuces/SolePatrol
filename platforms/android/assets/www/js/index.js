/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = function() {

    var self = {};
    self.is_configured = false;


    Vue.config.silent = false; // show all warnings

    //var database = new Firebase("https://www.gstatic.com/firebasejs/4.0.0/firebase.js");
    var config = {
        apiKey: "AIzaSyBCCs2yernjbV04R7uPeh0eF6q5aq7SPaw",
        authDomain: "solepatrolapp.firebaseapp.com",
        databaseURL: "https://solepatrolapp.firebaseio.com",
        projectId: "solepatrolapp",
        storageBucket: "solepatrolapp.appspot.com",
        messagingSenderId: "92561983251"
        };
    firebase.initializeApp(config);
    var dbref = firebase.database().ref();
    var storage = firebase.storage().ref();

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    // Enumerates an array.
    var enumerate = function(v) {
        var k=0;
        v.map(function(e) {e._idx = k++;});
    };

    // Initializes an attribute of an array of objects.
    var set_array_attribute = function (v, attr, x) {
        v.map(function (e) {e[attr] = x;});
    };

    self.initialize = function () {
        document.addEventListener('deviceready', self.ondeviceready, false);
    };

    self.ondeviceready = function () {
        // This callback is called once Cordova has finished its own initialization.
        console.log("The device is ready");
        $("#vue-div").show();
        self.is_configured = true;
    };

    // *From cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/*
    //
    self.setOptions = function (srcType) {
        var options = {
        // Some common settings are 20, 50, and 100
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        // In this app, dynamically set the picture source, Camera or photo gallery
        sourceType: srcType,
        encodingType: Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        allowEdit: true,
        correctOrientation: true  //Corrects Android orientation quirks
        }
        return options;
    };

    self.displayImage = function (imgUri) {

        var elem = document.getElementById('imageFile');
        elem.src = imgUri;
    };

    // *From cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/*
    // Gets a FileEntry object for the returned picture.
    self.getFileEntry = function (imgUri) {
        window.resolveLocalFileSystemURL(imgUri, function success(fileEntry) {

            // Do something with the FileEntry object, like write to it, upload it, etc.
            // writeFile(fileEntry, imgUri);


            var picRef = storage.child('solepatrolapp/' + fileEntry.fullPath);
            picRef.put(fileEntry).then(function(snapshot){
                alert(snapshot.val());
            });



             // displayFileData(fileEntry.nativeURL, "Native URL");

        }, function () {
            // If don't get the FileEntry (which may happen when testing
            // on some emulators), copy to a new FileEntry.
            //self.createNewFileEntry(imgUri);
        });
    };

    // *From cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/*
    // Testing how access photo album n selecting photo works.
    self.getphoto = function(){
        var srcType = Camera.PictureSourceType.SAVEDPHOTOALBUM;
        var options = self.setOptions(srcType);

        //When picked image, do this
        navigator.camera.getPicture(function cameraSuccess(imageUri) {

        self.getFileEntry(imageUri);

        self.displayImage(imageUri);
        console.log("***THE IMAGEURI IS " + imageUri);
            // Do something

        }, function cameraError(error) {
            console.debug("Unable to obtain picture: " + error, "app");

        }, options);

    };

    // This does a DB call to update feed listing to be displayed.
    self.populateFeed = function(){
        //Clear post dictionary
        self.vue.posts = [];

        dbref.orderByChild("Time").limitToFirst(10).on("child_added", function (snapshot){
            //console.log(snapshot.key);
            //var addData = JSON.stringify(snapshot.val());
            var addData = snapshot.val();
            self.vue.posts.push(addData);


        });

    };

    // Switches feed page to upload page
    self.uploadPage = function(){
        //Turn off feed flag
        self.vue.is_on_feed = false;

        //Turn on upload flag
        self.vue.is_uploading = true;

    };

    // Goes back from upload page to feed page without posting a photo.
    self.uploadToFeed = function(){

        // Turns off upload flag
        self.vue.is_uploading = false;

        // Turns on feed flag
        self.vue.is_on_feed = true;

    };

    // Whatever post is clicked, a vote page with the
    self.vote = function(title, shoename) {
        //Turn off the feed flag
        self.vue.is_on_feed = false;

        // Turn on the voting flag
        self.vue.is_voting = true;

        // Make post fields visible!
        var titleEl = document.getElementById("voteTitle");
        titleEl.style.display = "block";
        titleEl.innerHTML = title;

        var nameEl = document.getElementById("shoeName");
        nameEl.style.display = "block";
        nameEl.innerHTML = shoename;


        console.log("The title passed in is " + title);

        // Set up the image to be displayed from storage using id passed in.

    };

    self.setvotepage = function(title){
    var titleEl = document.getElementsById("voteTitle");
        titleEl.innerHTML = title;
    };

    //When back button is pressed, goes back to feed
    self.voteToFeed = function() {
    // Turn off the voting flag
    self.vue.is_voting = false;

    //Turn on the feed flag
    self.vue.is_on_feed = true;

    //Hides the displayed text!
    var titleEl = document.getElementById("voteTitle");
        titleEl.style.display = "none";

    var nameEl = document.getElementById("shoeName");
        nameEl.style.display = "none";



    };

    //Makes sure user inputted a picture and title before adding to DB.
    self.verify = function(imguri, name, pTitle){
        // As long as photo and title isn't null,
        // add pic and its fields to firebaseDB
        if(imguri  && pTitle != ""){
            self.postphoto(imguri, name, pTitle);
            alert("Photo posted to Legit Check feed!");
            //Turn upload flag off
            self.vue.is_uploading = false;

            //Turn feed flag on
            self.vue.is_on_feed = true;
        }
        else{
            // If a pic wasn't chosen, alert and don't add
            // to DB
            if(imguri == null ){
                alert("No shoe photo was selected from your photo album, please choose one!");
            }
            // If a title wasn't inputted, alert and don't add
            // to DB
            if(pTitle == ""){
                alert("No posting title was inputted, please put one!");
            }

        }

    };

    // Puts photo + name + time posted into firebase DB.
    self.postphoto = function(imguri ,name, pTitle){
        // I need imguri, name and time.


        // like 11/16/2015, 11:18:48 PM
        var currenttime = new Date(new Date().getTime()).toLocaleString();
        //var currenttime = new Date(new Date().getFullYear().toString()).getTime().toLocaleString();



        //Save the id of the image and pass in to Photo field of DB entry


        //This puts data into firebase DB
        dbref.push({
            Shoename: name,
            Photo: imguri ,
            PostTitle: pTitle,
            Time: currenttime,
            Legitcount: 0,
            Fakecount: 0,
            Totalvotes: 0

        });
        console.log("Added a photo to the Legit Check Feeds!");

        // Turn off upload flag.
        self.vue.is_uploading = false;

        // Turns on feed flag.
        self.vue.is_on_feed = true;
    };

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            posts: [],
            is_uploading: false,
            is_on_feed: true,
            is_voting: false
        },
        methods: {
        setOptions: self.setOptions,
        displayImage: self.displayImage,
        getFileEntry: self.getFileEntry,
        createNewFileEntry: self.createNewFileEntry,
        getphoto: self.getphoto,
        postphoto: self.postphoto,
        verify: self.verify,
        populateFeed: self.populateFeed,
        vote: self.vote,
        voteToFeed: self.voteToFeed,
        uploadPage: self.uploadPage,
        uploadToFeed: self.uploadToFeed

        }

    });


    self.populateFeed();
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){
    APP = app();
    APP.initialize();
});