document.addEventListener('DOMContentLoaded', () => {
  const keyInputSection = document.getElementById('key-input-section');
  const mainContainer = document.getElementById('main-container');
  const errorMessage = document.getElementById('error-message');
  
  var imageList = []
  var lastImage = new Image()
  for (var i = 1; i <= 12; i++) {
    var img = new Image()
    imageList.push(img)
    img.src = `images/loading/${i}.jpg`
    lastImage = img
  }
  lastImage.onload = function () {
    console.log("done")
  }

  var lastLoadChange = 0
  $("#loading-spinner").hide()
  function showLoading() {
    $("#loading-spinner").show()
    if ((Date.now() - lastLoadChange) > 2000) {
      lastLoadChange = Date.now()
      $("#loading-image").hide()
      let imageInt = Math.floor((Math.random() * 12) + 1);
      $("#loading-image").attr('src', `images/loading/${imageInt}.jpg`).on('load', function() {
        $("#loading-image").show()
      });
    }
  }

  // Airtable Configuration
  const TMP_PAT = "patsLyV0YxSHc0Sdi.9f968108897338d11cdec1c6dbd4e495b61f5b4ae123d11acb2ac026320e9c13";
  let AIRTABLE_PAT = ""; // will be retrieved if access code is correct
  const AIRTABLE_BASE_ID = "app4SV3eWvOgThgQi"; // Replace with your Base ID
  const AIRTABLE_TABLE_NAME = "Guest List"; // Replace with your Table Name
  const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

  var records = []
  var lan = "eng"
  var formModified = false

  var skip = false


  $( "#shuttle" ).on( "click", function() {
    $( "#shuttlefields" ).toggle( 200 );
  });

  $( "#shared" ).on( "click", function() {
    $( "#sharedfields" ).toggle( 200 );
  });

  $( "#optionalbox" ).hide();
  $( "#optionalaccordion" ).on( "click", function() {
    $( "#optionalbox" ).toggle( 200 );
  });

  $('textarea').keypress(function(event) {
    if (event.keyCode == 13) {
        event.preventDefault();
    }
  });

  // Submit on enter
  $('#key-input').keypress(function (e) {
    if (e.which == 13) {
      console.log("Enter pressed")
      $('#submit-key').click();
      return false;
    }
  });


    $('#rsvp-form').change(function() {
      formModified = true
    });

  // Fetch Access Codes from Airtable
  async function fetchAccessCodes(accessCode) {
    try {
      const response = await fetch(`${AIRTABLE_URL}?filterByFormula=%7BCode%7D+%3D+%22${accessCode}%22`, {
        headers: {
          Authorization: `Bearer ${TMP_PAT}`,
        },
      });
      const data = await response.json();
      records = data.records
      if (data.records.length > 0) {
        AIRTABLE_PAT = data.records[0].fields.PAT
        // console.log(data.records[0].fields["Message from us"])
        if(data.records[0].fields["Message from us"]) {
          $("#message-from-us").text(data.records[0].fields["Message from us"])
          $("#message-from-us").show()
        }
        else {
          $("#message-from-us").hide()
        }
        lan = data.records[0].fields.Language;
        switch(lan){
          case "eng":
            $(".eng").show()
            $(".ita").hide()
            $(".tur").hide()
            break;
          case "tur":
            $(".eng").hide()
            $(".ita").hide()
            $(".tur").show()
            break;
          case "ita":
            $(".eng").hide()
            $(".ita").show()
            $(".tur").hide()
            break;
          default:
            $(".eng").show()
            $(".ita").hide()
            $(".tur").hide()
            console.log("Could find language")
        }
        const pagesURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Static`;
        try {
          const pageResponse = await fetch(`${pagesURL}?filterByFormula=%7BLanguage%7D+%3D+%22${lan}%22`, {
            headers: {
              Authorization: `Bearer ${TMP_PAT}`,
            },
          });
          const data = await pageResponse.json();
          if (data.records.length > 0) {
            console.log("Success pages")
            $("#weddingDay").html(data.records[0].fields.Wedding)
            $("#info").html(data.records[0].fields.Additional)
          }
          else {
            console.log("Could find language")
          }
        }
        catch (error) {
          console.error("Error fetching pages from Airtable:", error);
          throw error;
        }
        return true; // Return true if a record is found
      }
      else {
        return false;
      }
    } catch (error) {
      console.error("Error fetching data from Airtable:", error);
      return false;
    }
  }

  async function populateForm(recordId) {
    try {
      showLoading();
      const response = await fetch(`${AIRTABLE_URL}/${recordId}`, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
        },
      });
      const data = await response.json();
      const form = document.getElementById('rsvp-form')
      form.elements["recordId"].value = data.id
      form.elements["name"].value = data.fields.Name || ""
      form.elements["attending"].value = data.fields.Attending || ""
      form.elements["email"].value = data.fields.Email || ""
      form.elements["allergies"].value = data.fields.Allergies || ""
      form.elements["shuttle"].checked = data.fields.Shuttle || false
      form.elements["shuttleAddress"].value = data.fields["Shuttle Address"] || ""
      form.elements["shared"].checked = data.fields.Shared || false
      form.elements["whatsapp"].value = data.fields.WhatsApp || ""
      form.elements["stayinfo"].value = data.fields.StayInfo || ""
      form.elements["songs"].value = data.fields.Songs || ""
      form.elements["play"].checked = data.fields.Play || false
      form.elements["message"].value = data.fields.Message || ""

      // for (const [key, value] of Object.entries(data.fields)) {
      //   console.log(key, value);
      // }

      if (data.fields.Shuttle) {
        $( "#shuttlefields" ).show();
      } else {
        $( "#shuttlefields" ).hide();
      }

      if (data.fields.Shared) {
        $( "#sharedfields" ).show();
      } else {
        $( "#sharedfields" ).hide();
      }


    } catch (error) {
      console.error("Error fetching data from Airtable:", error);
    } finally {
      formModified = false
      $("#loading-spinner").hide();
    }
  }

  async function updateUserList() {
    var buttons = []
    records.forEach(record => {
      const button = document.createElement('button');
      button.textContent = record.fields.Name || 'Guest'; // Use "Guest" if name is missing
      button.value = record.id
      button.id = record.id
      buttons.push(button);
    });
    document.getElementById('user-list').replaceChildren(...buttons)
    $("#user-list").on("click", "button", function() {
        if (formModified) {
          let confirmed = confirm("Some fields for the current guest have been modified. Do you want to ignore them and move to the next guest?")
          if (!confirmed) {
            return;
          }
        }
        console.log('Selected guest:', $(this).val());
        populateForm($(this).val());
        $("#user-list>button.active").removeClass("active");
        $(this).addClass("active");
      });
    if (records.length >= 1) {
      $("#"+records[0].id).addClass("active");
      await populateForm(records[0].id)
    }
  }
  
  // Show current Guest List
  async function showGuestList() {
    showLoading();
    try {
      const response = await fetch(`${AIRTABLE_URL}?filterByFormula=Shared%3DTRUE()`, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
        },
      });
      const data = await response.json();
      records = data.records
      // console.log(records)

      const listOfFieldsToShow = ["Name", "WhatsApp", "StayInfo"]
      const columnNames = ["Name/İsim/Nome", "WhatsApp", "Stay duration / Kalış süresi / Durata di permanenza"]


      let tableContent = '<thead><tr>'
      for (const field of columnNames) {
        tableContent += `<th scope="col">${field}</th>`
      }
      tableContent += '</tr></thead><tbody>'
      for (const record of records) {
        tableContent += '<tr>'
        for (const field of listOfFieldsToShow) {
          tableContent += '<td>' + (record.fields[field] || "") + '</td>'
        }
        tableContent += '</tr>'
      }
      tableContent += '</tbody>'

      document.getElementById('guest-list').innerHTML = tableContent

    } catch (error) {
      console.error("Error fetching data from Airtable:", error);
    } finally {
      $("#loading-spinner").hide();
    }
  }


  // Check access key & grant access
  $('#submit-key').on('click', async function() {
    const key = document.getElementById('key-input').value.toLowerCase().trim();
    if (key == "") {
      errorMessage.textContent = "Incorrect / Yanlış / Errata";
      errorMessage.classList.remove("hidden");
      return false;
    }
    showLoading();
    errorMessage.classList.add("hidden");
    
    try {
      if (skip) {
        keyInputSection.classList.add("hidden");
        mainContainer.classList.remove("hidden");
        $(".menu").show();
        $(":root").css("--font-color", $(":root").css("--orange",))
        $(":root").css("--bg_image", $(":root").css("--orange_bg",))
        $("#loading-spinner").hide();
        return;
      }
      const isValidKey = await fetchAccessCodes(key);
      if (isValidKey) {
        keyInputSection.classList.add("hidden");
        mainContainer.classList.remove("hidden");
        await updateUserList();
        await showGuestList();
        $(".menu").show();
        $(":root").css("--font-color", $(":root").css("--orange",))
        $(":root").css("--bg_image", $(":root").css("--orange_bg",))
      } else {
        errorMessage.textContent = "Incorrect / Yanlış / Errata";
        errorMessage.classList.remove("hidden");
        console.log("invalid key")
      }
      
    } catch (error) {

      errorMessage.textContent = "Internet error :( Ask Fil ";
      errorMessage.classList.remove("hidden");
      console.log(error)
    } finally {
      $("#loading-spinner").hide();
    }
  });

  // Menu navigation
  $(".menu-item").click(function () {
    $(".menu-item.selected").removeClass("selected");
    $(this).addClass("selected");
    let target = $(this).data("target")
    console.log(target)
    if (target == ("#rsvp")) { // orange
      $(":root").css("--font-color", $(":root").css("--orange",))
      $(":root").css("--bg_image", $(":root").css("--orange_bg",))
    } else if (target == ("#weddingDay")) {
      $(":root").css("--font-color", $(":root").css("--green",))
      $(":root").css("--bg_image", $(":root").css("--green_bg",))
    } else if (target == ("#info")) {
      $(":root").css("--font-color", $(":root").css("--blue",))
      $(":root").css("--bg_image", $(":root").css("--blue_bg",))
    }

    $(".menu").removeClass("expanded")
    $("main").removeClass("right")
    $(".content-section.active").removeClass("active")
    $(target).addClass("active")
  })

  // Content navigation
  document.querySelectorAll('button[data-target]').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      document.querySelectorAll('.content-section.active').forEach(section => {
        if (section != document.getElementById(target)) {
          section.classList.remove('active');
          setTimeout(() => {
            section.style.display = "none"
          }, 500);
        }
      });
      document.getElementById(target).style.display = "block";
      setTimeout(() => {
        document.getElementById(target).classList.add('active')
      }, 300);
    });
  });

  // RSVP Submission Handler
  document.getElementById('rsvp-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Show loading spinner
    showLoading();

    // Get form data
    const formData = new FormData(e.target);
    console.log(formData.get('shuttle'))
    const data = {
      fields: {
        Name: formData.get('name'),
        Email: formData.get('email'),
        Attending: formData.get('attending'),
        Allergies: formData.get('allergies'),
        Shuttle: formData.get('shuttle') ? true : false,
        "Shuttle Address": formData.get('shuttleAddress'),
        Shared: formData.get('shared') ? true : false,
        WhatsApp: formData.get('whatsapp'),
        StayInfo: formData.get('stayinfo'),
        Songs: formData.get('songs'),
        Play: formData.get('play') ? true : false,
        Message: formData.get('message')
      },
    };

    try {
      // Send data to Airtable
      console.log(`${AIRTABLE_URL}/${formData.get('recordId')}`);
      const response = await fetch(`${AIRTABLE_URL}/${formData.get('recordId')}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AIRTABLE_PAT}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }
      else {
        let message = ""
        switch(lan){
          case "eng":
            message = `Details updated for ${data.fields.Name}!`
            break;
          case "tur":
            message = `NEED TO TRANSLATE - ${data.fields.Name}`
            break;
          case "ita":
            message = `Dettagli aggiornati per ${data.fields.Name}!`
          default:
            message = `Details updated for ${data.fields.Name}`
            console.log("Could find language", lan)
        }
        alert(message);
        formModified = false;
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      let message = ""
      switch(lan){
        case "eng":
          message = 'Something went wrong while updating details. Please get angry with Fil'
          break;
        case "tur":
          message = 'NEED TO TRANSLATE'
          break;
        case "ita":
          message = "Qualcosa è andato storto durante l'aggiornamento. Per favore arrabbiati con Filippo"
        default:
          message = 'Something went wrong while updating details. Please get angry with Fil'
          console.log("Could find language", lan)
      }
      alert(message);
    } finally {
      // Hide loading spinner
      $("#loading-spinner").hide();
    }
  });
  
  $(".menu").click(function() {
    $(".menu").toggleClass("expanded")
    $("main").toggleClass("right")
  }).children().click(function(e) {
    e.stopPropagation();
  });

});
