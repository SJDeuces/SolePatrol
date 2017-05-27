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
            console.log("got file: " + fileEntry.fullPath);
             // displayFileData(fileEntry.nativeURL, "Native URL");

        }, function () {
            // If don't get the FileEntry (which may happen when testing
            // on some emulators), copy to a new FileEntry.
            self.createNewFileEntry(imgUri);
        });
    };

    // *From cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/*
    // creates a file in your app's cache (in sandboxed storage) named tempFile.jpeg. With the new FileEntry object,
    // you can copy the image to the file or do something else like upload it.
    self.createNewFileEntry = function (imgUri) {
        window.resolveLocalFileSystemURL(cordova.file.cacheDirectory, function success(dirEntry) {

            // JPEG file
            dirEntry.getFile("tempFile.jpeg", { create: true, exclusive: false }, function (fileEntry) {

                // Do something with it, like write to it, upload it, etc.
                console.log("its going here!");
                //writeFile(fileEntry, imgUri);
                console.log("got file: " + fileEntry.fullPath);
                // displayFileData(fileEntry.fullPath, "File copied to");

            }, onErrorCreateFile);

        }, onErrorResolveUrl);
    }

    // *From cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/*
    // Testing how access photo album n selecting photo works.
    self.getphoto = function(){
        var srcType = Camera.PictureSourceType.SAVEDPHOTOALBUM;
        var options = self.setOptions(srcType);
        //var func = createNewFileEntry;

        navigator.camera.getPicture(function cameraSuccess(imageUri) {
        //self.createNewFileEntry(imageUri);
        self.displayImage(imageUri);

            // Do something

        }, function cameraError(error) {
            console.debug("Unable to obtain picture: " + error, "app");

        }, options);

    };

    // Puts photo + name + time posted into firebase DB.
    self.postphoto = function(imguri, name){
        // I need imguri, name and time.
        var myFirebaseRef = new Firebase("https://solepatrolapp.firebaseio.com/");

        // like 11/16/2015, 11:18:48 PM
        var currenttime = new Date(new Date().getTime()).toLocaleString();

        //This puts data into firebase DB
        myFirebaseRef.set({
            Shoename: name,
            photo: imguri,
            time: currenttime,
            legitcount: 0,
            fakecount: 0,
            totalvotes: 0

        });

        // Turn off upload flag.

        // Turn on feed flag to go to the feed divs.


    }

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
        },
        methods: {
        setOptions: self.setOptions,
        displayImage: self.displayImage,
        getFileEntry: self.getFileEntry,
        createNewFileEntry: self.createNewFileEntry,
        getphoto: self.getphoto,
        postphoto: self.postphoto

        }

    });

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){
    APP = app();
    APP.initialize();
});