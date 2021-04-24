function post(path, params, method = "post") {
  // The rest of this code assumes you are not using a library.
  // It can be made less wordy if you use one.
  const form = document.createElement("form");
  form.method = method;
  form.action = path;

  for (const key in params) {
    const hiddenField = document.createElement("input");
    hiddenField.type = "hidden";
    hiddenField.name = key;
    hiddenField.value = params[key];

    form.appendChild(hiddenField);
  }

  document.body.appendChild(form);
  form.submit();
}
(function ($) {
  showSwal = function (type) {
    "use strict";
    if (type === "basic") {
      swal({
        text: "Any fool can use a computer",
        button: {
          text: "OK",
          value: true,
          visible: true,
          className: "btn btn-primary",
        },
      });
    } else if (type === "title-and-text") {
      swal({
        title: "Read the alert!",
        text: "Click OK to close this alert",
        button: {
          text: "OK",
          value: true,
          visible: true,
          className: "btn btn-primary",
        },
      });
    } else if (type === "success-message") {
      swal({
        title: "Congratulations!",
        text: "You entered the correct answer",
        icon: "success",
        button: {
          text: "Continue",
          value: true,
          visible: true,
          className: "btn btn-primary",
        },
      });
    } else if (type === "auto-close") {
      swal({
        title: "Auto close alert!",
        text: "I will close in 2 seconds.",
        timer: 2000,
        button: false,
      }).then(
        function () {},
        // handling the promise rejection
        function (dismiss) {
          if (dismiss === "timer") {
            console.log("I was closed by the timer");
          }
        }
      );
    } else if (type === "warning-message-and-cancel") {
      swal({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3f51b5",
        cancelButtonColor: "#ff4081",
        confirmButtonText: "Great ",
        buttons: {
          cancel: {
            text: "Cancel",
            value: null,
            visible: true,
            className: "btn btn-danger",
            closeModal: true,
          },
          confirm: {
            text: "OK",
            value: true,
            visible: true,
            className: "btn btn-primary",
            closeModal: true,
          },
        },
      });
    } else if (type === "custom-html") {
      swal({
        content: {
          element: "input",
          attributes: {
            placeholder: "Type your password",
            type: "password",
            class: "form-control",
          },
        },
        button: {
          text: "OK",
          value: true,
          visible: true,
          className: "btn btn-primary",
        },
      });
    } else if (type === "submit-video-confirmation1") {
      const videoIdRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const videoLink = document.getElementById('videoLink1')
      var video_id = videoLink.value.match(videoIdRegex);
      video_id = video_id[video_id.length - 1];
      const content = document.createElement("div");
      const iframe = document.createElement("iframe");
      
      iframe.src = "https://www.youtube.com/embed/"+video_id;
      iframe.width = "100%";
      iframe.allow =
        "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
      iframe.setAttribute("allowFullScreen", "");
      content.appendChild(iframe);
      swal({
        title: 'Sure to submit the video ?',
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3f51b5",
        cancelButtonColor: "#ff4081",
        confirmButtonText: "Great ",
        content,
        buttons: {
          cancel: {
            text: "Cancel",
            value: null,
            visible: true,
            className: "btn btn-danger",
            closeModal: true,
          },
          confirm: {
            text: "Submit Video",
            value: true,
            visible: true,
            className: "btn btn-primary",
            closeModal: false,
          },
        },
      }).then(function(isConfirm){
        const formData = document.getElementsByClassName('formData1')
        const paramsData = document.getElementsByClassName('params1')
        let form = {}
        let params = {}
        for(const entry of paramsData)
         params[entry.name] = entry.value
        for(const entry of formData)
         form[entry.name] = entry.value
        if(isConfirm){
          const path = `/uploadVideo/${params.matchId}/${params.playerId}/${params.currentPlayerId==params.player1DetailsId ? 2:1}`
          console.log(path)
          post(path,form)
        }
        console.log(params)
      });
    }
    else if (type === "submit-video-confirmation2") {
      const videoIdRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const videoLink = document.getElementById('videoLink2')
      var video_id = videoLink.value.match(videoIdRegex);
      video_id = video_id[video_id.length - 1];
      const content = document.createElement("div");
      const iframe = document.createElement("iframe");
      
      iframe.src = "https://www.youtube.com/embed/"+video_id;
      iframe.width = "100%";
      iframe.allow =
        "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
      iframe.setAttribute("allowFullScreen", "");
      content.appendChild(iframe);
      swal({
        title: 'Sure to submit the video ?',
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3f51b5",
        cancelButtonColor: "#ff4081",
        confirmButtonText: "Great ",
        content,
        buttons: {
          cancel: {
            text: "Cancel",
            value: null,
            visible: true,
            className: "btn btn-danger",
            closeModal: true,
          },
          confirm: {
            text: "Submit Video",
            value: true,
            visible: true,
            className: "btn btn-primary",
            closeModal: false,
          },
        },
      }).then(function(isConfirm){
        const formData = document.getElementsByClassName('formData2')
        const paramsData = document.getElementsByClassName('params2')
        let form = {}
        let params = {}
        for(const entry of paramsData)
         params[entry.name] = entry.value
        for(const entry of formData)
         form[entry.name] = entry.value
        if(isConfirm){
          const path = `/uploadVideo/${params.matchId}/${params.playerId}/${params.currentPlayerId==params.player1DetailsId ? 2:1}`
          console.log(path)
          post(path,form)
        }
        console.log(params)
      });
    }
  };
})
(jQuery);
