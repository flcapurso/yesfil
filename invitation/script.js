$(document).ready(function() {
  
  $('#wrapper').click(function() {
    $('.envelope').addClass('open');
  });

  let searchParams = new URLSearchParams(window.location.search)
  let names = searchParams.get('names')
  let secret = searchParams.get('secret')
  const lang = location.href.split("/").slice(-1)[0].split(".")[0]
  console.log(names)
  console.log(secret)

  if (lang == "ita") {
    if (names.includes(",")) {
      names = "Cari " + names
    }
    else if (names.slice(-1) == "a") {
      names = "Cara " + names
      $(".plur").hide();
      $(".sing").show();
    }
    else {
      names = "Caro " + names
      $(".plur").hide();
      $(".sing").show();
    }
  }

  if (names) {
    $('#names').text(names)
    $('#secret').text(secret)
  }


});