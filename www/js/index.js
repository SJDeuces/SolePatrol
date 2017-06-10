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
    var dbref = firebase.database().ref('posts');
    var storage = firebase.storage().ref('solepatrolapp');

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

    self.success = function (file) {
    //console.log("File size: " + file.size);
    var picRef = storage.child(file.name);
    //var blob = new Blob([file],{type:'image/jpg'});
    //var url = URL.createObjectURL(blob);


    picRef.put(blob).then(function(snapshot){
                alert("CONGRATZ U UPLOADED A FILE .... FUCK!");
    });

    };

    self.fail = function (error) {
    alert("Unable to retrieve file properties: " + error.code);
    };



    // *From cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/*
    // Gets a FileEntry object for the returned picture.
    self.getFileEntry = function (imgUri) {
        window.resolveLocalFileSystemURL(imgUri, function success(fileEntry) {

            // Do something with the FileEntry object, like write to it, upload it, etc.
            // writeFile(fileEntry, imgUri);

            var blob = new Blob([fileEntry],{type:'image/jpg'});
            var url = URL.createObjectURL(blob);



            var metadata = {
                contentType: 'image/jpeg',

            };

            var picRef = storage.child(fileEntry.fullPath);
            //fileEntry.file(self.success, self.fail);

            picRef.put(blob, metadata).then(function(snapshot){

             alert("CONGRATZ U UPLOADED A FILE .... FUCK!");

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

        //If populating for real archive
        if(self.vue.is_real_archive){
            dbref.orderByChild("Totalvotes").limitToLast(50).on("child_added", function (snapshot){
                var newRdata = snapshot.val();
                var realpercentage = newRdata["Legitcount"] / newRdata["Totalvotes"];

                if(realpercentage > (.5)){
                    self.vue.posts.push(newRdata);
                }

            });

        }
        // if its populating for fake archive
        else if(self.vue.is_fake_archive){
            dbref.orderByChild("Totalvotes").limitToLast(50).on("child_added", function (snapshot){
                var newFdata = snapshot.val();
                var fakepercentage = (newFdata["Fakecount"] / newFdata["Totalvotes"]);
                if(fakepercentage > (.5)){
                    self.vue.posts.push(newFdata);
                }

            });

        }
        // Then its for main feed
        else{
            dbref.orderByChild("Totalvotes").limitToFirst(10).on("child_added", function (snapshot){
                //console.log(snapshot.key);

                var addData = snapshot.val();

                // This adds a field that stores the posts key so your can modify
                // The specific field later!!!!
                addData["Key"] = snapshot.key;

                self.vue.posts.push(addData);


            });
        }
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

    // Whatever a post's view button is pressed, displayed image assoc.
    // with it.
    self.view = function(title, shoename) {
        alert("Now viewing a picture of a(n) " + shoename + "\nfrom post: " + title);
        //Turn off the feed flag
        self.vue.is_on_feed = false;

        // Turn on the viewing flag
        self.vue.is_viewing = true;

        // Make post fields visible!
        var titleEl = document.getElementById("voteTitle");
        titleEl.style.display = "block";
        titleEl.innerHTML = title;

        var nameEl = document.getElementById("shoeName");
        nameEl.style.display = "block";
        nameEl.innerHTML = shoename;


        // Set up the image to be displayed from storage using id passed in.

    };

    //Increments vote count for real when button pushed
    self.realvote = function (postkey , realcount, totalvotes, shoename,
    photo, posttitle, time, fakecount ){

        var newreal = realcount + 1;
        var newvotes = totalvotes + 1;

        firebase.database().ref('posts/' + postkey).set({
            Shoename: shoename,
            Photo: photo,
            PostTitle: posttitle,
            Time: time,
            Legitcount: newreal,
            Fakecount: fakecount,
            Totalvotes: newvotes
        });

        alert("You voted REAL for the post: " + posttitle + "\nfor the shoe: " + shoename);
        self.populateFeed();
    };

    //Increments vote count for fake count when posts button pushed
    self.fakevote = function (postkey, fakecount, totalvotes, shoename,
    photo, posttitle, time, realcount ) {

        var newfake = fakecount + 1;
        var newvotes = totalvotes + 1;

        firebase.database().ref('posts/' + postkey).set({
            Shoename: shoename,
            Photo: photo,
            PostTitle: posttitle,
            Time: time,
            Legitcount: realcount,
            Fakecount: newfake,
            Totalvotes: newvotes

        });

        alert("You voted FAKE for the post: " + posttitle + "\nfor the shoe: " + shoename);
        self.populateFeed();

    };

    // Turns on real archive listings from button press
    self.realArchive = function (){
        // Turns off legit check feed
        self.vue.is_on_feed = false;

        // Turns on real archive flag
        self.vue.is_real_archive = true;

        self.populateFeed();

    };

    // Turns on fake archive listings from button press
    self.fakeArchive = function (){
        // Turns off legit check feed
        self.vue.is_on_feed = false;

        // Turns on real archive flag
        self.vue.is_fake_archive = true;

        self.populateFeed();

    };



    // In real archive when someone views a shoe photo
    self.viewRarchive = function (photo, shoename, realcount, totalcount) {
        //Turns off Real archive listing
        self.vue.is_real_archive = false;

        //Turns on Real archive viewing specific photo
        self.vue.is_viewing_rarchive = true;


        var nameEl = document.getElementById("shoeName");
        nameEl.style.display = "block";
        nameEl.innerHTML = shoename;

        var percentEl = document.getElementById("percentage");
        percentEl.style.display = "block";

        var percent = (realcount / totalcount) * 100;
        var percentdisplay = Math.round(percent);

        var percentEl = document.getElementById("percentage");
        percentEl.style.display = "block";
        percentEl.style.color = "green";
        percentEl.innerHTML = percentdisplay + "% voted Real";

        var totalEl = document.getElementById("totalv");
        totalEl.style.display = "block";
        totalEl.style.color = "green";
        totalEl.innerHTML = "out of " +totalcount + " total votes";



    };

    // In fake archive when someone views a shoe photo
    self.viewFarchive = function (photo, shoename, fakecount, totalcount) {
        //Turns off Fake archive listing
        self.vue.is_fake_archive = false;

        //Turns on fake archive viewing specifc photo
        self.vue.is_viewing_farchive = true;


        var nameEl = document.getElementById("shoeName");
        nameEl.style.display = "block";
        nameEl.innerHTML = shoename;

        var percent = (fakecount / totalcount) * 100;
        var percentdisplay = Math.round(percent);
        var percentEl = document.getElementById("percentage");
        percentEl.style.display = "block";
        percentEl.style.color = "red";
        percentEl.innerHTML = percentdisplay + "% voted Fake";

        var totalEl = document.getElementById("totalv");
        totalEl.style.display = "block";
        totalEl.style.color = "red";
        totalEl.innerHTML = "out of " + totalcount + " total votes";

    };

    // Goes from specific photo view to main real archive feed
    self.viewtorarchive = function() {
        // Turns off viewing real archive flag
        self.vue.is_viewing_rarchive = false;

        // Turns on real archive feed flag
        self.vue.is_real_archive = true;

        //Hides shoename display
        var nameEl = document.getElementById("shoeName");
        nameEl.style.display = "none";

        var percentEl = document.getElementById("percentage");
        percentEl.style.display = "none";

        var totalEl = document.getElementById("totalv");
        totalEl.style.display = "none";
    };

    // Goes from specific photo view to main fake archive feed
    self.viewtofarchive = function() {
        //Turns off viewing fake archive flag
        self.vue.is_viewing_farchive = false;

        // Tuns on fake archive feed flag
        self.vue.is_fake_archive = true;

        // Hides shoename display
        var nameEl = document.getElementById("shoeName");
        nameEl.style.display = "none";

        var percentEl = document.getElementById("percentage");
        percentEl.style.display = "none";

        var totalEl = document.getElementById("totalv");
        totalEl.style.display = "none";
    };


    // Changes real archive display back to main feed
    self.rArchivetofeed = function (){
        // Turns real archive flag off
        self.vue.is_real_archive = false;

        // Turns on main feed flag on
        self.vue.is_on_feed = true;

         self.populateFeed();

    };

    // Changes archive display back to main feed
    self.fArchivetofeed = function (){
        // Turns fake archive flag off
        self.vue.is_fake_archive = false;

        // Tuns on main feed flag on
        self.vue.is_on_feed = true;

         self.populateFeed();
    };



    self.setvotepage = function(title){
    var titleEl = document.getElementsById("voteTitle");
        titleEl.innerHTML = title;
    };

    //When back button is pressed, goes back to feed
    self.viewToFeed = function() {
    // Turn off the voting flag
    self.vue.is_viewing = false;

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

        //Save the id of the image and pass in to Photo field of DB entry


        //This puts data into firebase DB
        var newpost = dbref.push({
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
        self.populateFeed();

    };

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            posts: [],
            is_uploading: false,
            is_on_feed: true,
            is_viewing: false,
            is_viewing_rarchive: false,
            is_viewing_farchive: false,
            is_real_archive: false,
            is_fake_archive: false
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
        view: self.view,
        viewToFeed: self.viewToFeed,
        uploadPage: self.uploadPage,
        uploadToFeed: self.uploadToFeed,
        realArchive: self.realArchive,
        fakeArchive: self.fakeArchive,
        viewRarchive: self.viewRarchive,
        viewFarchive: self.viewFarchive,
        viewtorarchive: self.viewtorarchive,
        viewtofarchive: self.viewtofarchive,
        rArchivetofeed: self.rArchivetofeed,
        fArchivetofeed: self.fArchivetofeed,
        realvote: self.realvote,
        fakevote: self.fakevote,
        success: self.success,
        fail: self.fail
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