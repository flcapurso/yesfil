$(document).ready(function() {
  
  $('#wrapper').click(function() {
    $('.envelope').addClass('open');
  });

  let searchParams = new URLSearchParams(window.location.search)
  let names = searchParams.get('names')
  let secret = searchParams.get('secret')
  console.log(names)
  console.log(secret)

  $('#names').text('Dear ' + names)
  $('#secret').text(secret)


});