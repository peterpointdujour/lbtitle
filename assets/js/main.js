/* =========================================================
   LB TITLE
   Main JavaScript
   ========================================================= */


/* =========================================================
   LIEN INTAKE
   ========================================================= */

const lienForm = document.querySelector("#lien-form");

if (lienForm) {
  const lienChoices = lienForm.querySelectorAll(
    'input[name="lien_type"]'
  );

  const mechanicalFields =
    document.querySelector("#mechanical-fields");

  const towFields =
    document.querySelector("#tow-fields");

  const formSubmit =
    document.querySelector("#form-submit");


  lienChoices.forEach((choice) => {
    choice.addEventListener("change", () => {
      const isMechanical =
        choice.value === "mechanical";

      mechanicalFields.hidden = !isMechanical;
      towFields.hidden = isMechanical;

      formSubmit.hidden = false;


      mechanicalFields
        .querySelectorAll("input, textarea, select")
        .forEach((field) => {
          field.required = isMechanical;
          field.disabled = !isMechanical;
        });


      towFields
        .querySelectorAll("input, textarea, select")
        .forEach((field) => {
          field.required = !isMechanical;
          field.disabled = isMechanical;
        });
    });
  });


  /*
   * Keep both conditional branches out of the
   * submission until the customer chooses one.
   */
  mechanicalFields
    .querySelectorAll("input, textarea, select")
    .forEach((field) => {
      field.disabled = true;
    });

  towFields
    .querySelectorAll("input, textarea, select")
    .forEach((field) => {
      field.disabled = true;
    });
}


/* =========================================================
   DEALER INTAKE
   ========================================================= */

const dealerForm = document.querySelector("#dealer-form");

if (dealerForm) {
  const params =
    new URLSearchParams(window.location.search);

  const requestedService =
    params.get("service");


  if (requestedService) {
    const matchingService =
      dealerForm.querySelector(
        `input[name="dealer_service"][value="${requestedService}"]`
      );

    if (matchingService) {
      matchingService.checked = true;
    }
  }
}