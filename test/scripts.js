$(document).ready(function () {
    $(".menu-item").click(function () {
      console.log("")
        // $(".menu-item").not(this).removeClass("expanded"); // Collapse others
        $(this).addClass("expanded");
    });

    // $(document).click(function (event) {
    //     if (!$(event.target).closest(".menu-item").length) {
    //         $(".menu-item").removeClass("expanded");
    //     }
    // });
});