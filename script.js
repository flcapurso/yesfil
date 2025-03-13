document.addEventListener('DOMContentLoaded', () => {
  const keyInputSection = document.getElementById('key-input-section');
  const mainContainer = document.getElementById('main-container');
  const loadingSpinner = document.getElementById('loading-spinner');
  const errorMessage = document.getElementById('error-message');

  // Airtable Configuration
  const AIRTABLE_PAT = "patsLyV0YxSHc0Sdi.9f968108897338d11cdec1c6dbd4e495b61f5b4ae123d11acb2ac026320e9c13"; // Replace with your PAT
  const AIRTABLE_BASE_ID = "app4SV3eWvOgThgQi"; // Replace with your Base ID
  const AIRTABLE_TABLE_NAME = "Guest List"; // Replace with your Table Name
  const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

  var records = []

  var skip = false


  $( "#shared" ).on( "click", function() {
    $( "#sharedfields" ).toggle( 200 );
  });

  $( "#optionalbox" ).hide();
  $( "#optionalaccordion" ).on( "click", function() {
    $( "#optionalbox" ).toggle( 200 );
  });

  // Fetch Access Codes from Airtable
  async function fetchAccessCodes(accessCode) {
    try {
      const response = await fetch(`${AIRTABLE_URL}?filterByFormula=%7BAccess+Code%7D+%3D+%22${accessCode}%22`, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
        },
      });
      const data = await response.json();
      records = data.records
      return data.records.length > 0; // Return true if a record is found
    } catch (error) {
      console.error("Error fetching data from Airtable:", error);
      return false;
    }
  }

  async function populateForm(recordId) {
    try {
      loadingSpinner.classList.remove("hidden");
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
      form.elements["shared"].checked = data.fields.Shared || false
      form.elements["whatsapp"].value = data.fields.WhatsApp || ""
      form.elements["stayinfo"].value = data.fields.StayInfo || ""
      form.elements["songs"].value = data.fields.Songs || ""
      form.elements["message"].value = data.fields.Message || ""

      // for (const [key, value] of Object.entries(data.fields)) {
      //   console.log(key, value);
      // }
      console.log
      if (data.fields.Shared) {
        $( "#sharedfields" ).show();
      } else {
        $( "#sharedfields" ).hide();
      }


    } catch (error) {
      console.error("Error fetching data from Airtable:", error);
    } finally {
      loadingSpinner.classList.add("hidden");
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
    loadingSpinner.classList.remove("hidden");
    try {
      const response = await fetch(`${AIRTABLE_URL}?filterByFormula=OR(Attending%3D%22Yep%22%2C+Attending%3D%22Maybe%22)`, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
        },
      });
      const data = await response.json();
      records = data.records
      console.log(records)

      const listOfFieldsToShow = ["Name", "Attending", "Ideal stay duration"]

      let tableContent = '<thead><tr>'
      for (const field of listOfFieldsToShow) {
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
      loadingSpinner.classList.add("hidden");
    }
  }

  // Check access key & grant access
  document.getElementById('submit-key').addEventListener('click', async () => {
    const key = document.getElementById('key-input').value.trim();
    loadingSpinner.classList.remove("hidden");
    errorMessage.classList.add("hidden");
    
    try {
      if (skip) {
        keyInputSection.classList.add("hidden");
        mainContainer.classList.remove("hidden");
      }
      const isValidKey = await fetchAccessCodes(key);
      if (isValidKey) {
        keyInputSection.classList.add("hidden");
        mainContainer.classList.remove("hidden");
        await updateUserList();
        await showGuestList();
      } else {
        errorMessage.textContent = "Invalid key. Please try again.";
        errorMessage.classList.remove("hidden");
      }
      
    } catch (error) {

      errorMessage.textContent = "Invalid key. Please try again.";
      errorMessage.classList.remove("hidden");
    } finally {
      loadingSpinner.classList.add("hidden");
    }
  });

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
    loadingSpinner.classList.remove("hidden");

    // Get form data
    const formData = new FormData(e.target);
    const data = {
      fields: {
        Name: formData.get('name'),
        Email: formData.get('email'),
        Attending: formData.get('attending')
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
      alert('Thank you! Your response has been recorded.');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      // Hide loading spinner
      loadingSpinner.classList.add("hidden");
    }
  });

});
