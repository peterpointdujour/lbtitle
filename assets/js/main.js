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



/* =========================================================
   LB ROOM SHELL
   Homepage workspace navigation
   ========================================================= */

const lbRoomShell =
  document.querySelector("#lb-room-shell");

if (lbRoomShell) {

  const roomButtons =
    document.querySelectorAll("[data-room-target]");

  const rooms =
    document.querySelectorAll("[data-room]");


  function openRoom(roomName) {

    const targetRoom =
      document.querySelector(
        `[data-room="${roomName}"]`
      );

    if (!targetRoom) {
      return;
    }


    rooms.forEach((room) => {
      const isActive =
        room === targetRoom;

      room.hidden = !isActive;

      room.classList.toggle(
        "is-active",
        isActive
      );
    });


    roomButtons.forEach((button) => {

      const isActive =
        button.dataset.roomTarget === roomName;

      button.classList.toggle(
        "is-active",
        isActive
      );

      if (isActive) {
        button.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        button.removeAttribute(
          "aria-current"
        );
      }

    });


    /*
     * Keep the selected room in the URL
     * without reloading the page.
     *
     * Example:
     * lbtitle.co/#tag
     */

    if (history.replaceState) {
      history.replaceState(
        null,
        "",
        `#${roomName}`
      );
    }

  }


  roomButtons.forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const roomName =
          button.dataset.roomTarget;

        openRoom(roomName);

      }
    );

  });


  /*
   * Allow direct links such as:
   *
   * #title
   * #lien
   * #tag
   * #dealer
   */

  const requestedRoom =
    window.location.hash
      .replace("#", "")
      .trim();


  const validRoom =
    document.querySelector(
      `[data-room="${requestedRoom}"]`
    );


  if (requestedRoom && validRoom) {
    openRoom(requestedRoom);
  } else {
    openRoom("home");
  }

}


/* =========================================================
   LB SIDEBAR COLLAPSE
   Desktop shell preference
   ========================================================= */

if (lbRoomShell) {

  const lbApp =
    document.querySelector(".lb-app");

  const sidebarToggle =
    document.querySelector(".lb-sidebar-toggle");

  const sidebarRoomLabels = {
    "home": "H",
    "vehicle-check": "VC",
    "title": "T",
    "lien": "L",
    "tag": "TG",
    "dealer": "D",
    "about": "A",
    "reviews": "R",
    "contact": "C"
  };


  document
    .querySelectorAll(".lb-room-link")
    .forEach((button) => {

      const roomName =
        button.dataset.roomTarget;

      if (
        roomName &&
        sidebarRoomLabels[roomName]
      ) {
        button.dataset.roomShort =
          sidebarRoomLabels[roomName];
      }

    });


  function setSidebarCollapsed(
    collapsed,
    savePreference = true
  ) {

    if (!lbApp || !sidebarToggle) {
      return;
    }

    lbApp.classList.toggle(
      "is-sidebar-collapsed",
      collapsed
    );

    sidebarToggle.setAttribute(
      "aria-expanded",
      String(!collapsed)
    );

    sidebarToggle.setAttribute(
      "aria-label",
      collapsed
        ? "Expand sidebar"
        : "Collapse sidebar"
    );

    sidebarToggle.setAttribute(
      "title",
      collapsed
        ? "Expand sidebar"
        : "Collapse sidebar"
    );


    if (savePreference) {

      try {
        localStorage.setItem(
          "lb-sidebar-collapsed",
          collapsed ? "1" : "0"
        );
      } catch (error) {
        /* Storage is optional. */
      }

    }

  }


  let savedSidebarState = false;

  try {
    savedSidebarState =
      localStorage.getItem(
        "lb-sidebar-collapsed"
      ) === "1";
  } catch (error) {
    savedSidebarState = false;
  }


  setSidebarCollapsed(
    savedSidebarState,
    false
  );


  if (sidebarToggle) {

    sidebarToggle.addEventListener(
      "click",
      () => {

        const collapsed =
          !lbApp.classList.contains(
            "is-sidebar-collapsed"
          );

        setSidebarCollapsed(collapsed);

      }
    );

  }

}



/* =========================================================
   LB CONTACT AMBIENT MESSAGE SYSTEM
   Gate 2A rotating prototype
   ========================================================= */

if (lbRoomShell) {

  const contactMessage =
    document.querySelector(
      '[data-room-message="contact"]'
    );

  const contactRoom =
    document.querySelector(
      '[data-room="contact"]'
    );

  let contactMessageTimer = null;
  let contactMessageIndex = 0;


  function getTimeGreeting() {

    const hour =
      new Date().getHours();

    if (hour < 12) {
      return "Good morning. We're here to help.";
    }

    if (hour < 17) {
      return "Good afternoon. We're here to help.";
    }

    return "Good evening. We're here to help.";

  }


  function getContactMessages() {

    return [
      {
        text: getTimeGreeting(),
        signature: false
      },
      {
        text: "Real people. Real support.",
        signature: false
      },
      {
        text: "Questions are where solutions begin.",
        signature: false
      },
      {
        text: "Title. Lien. Tag. Dealer. One place.",
        signature: false
      },
      {
        text: "A smoother road starts with the right next step.",
        signature: false
      },
      {
        text: "Powered by VALRYN OS.",
        signature: false
      },
      {
        text: "Make them ask how.",
        signature: true
      },
      {
        text: "LB TITLE · EST. 2014",
        signature: false
      }
    ];

  }


  function contactIsActive() {

    return Boolean(
      contactRoom &&
      !contactRoom.hidden &&
      contactRoom.classList.contains(
        "is-active"
      )
    );

  }


  function clearContactTimer() {

    if (contactMessageTimer) {
      clearTimeout(contactMessageTimer);
      contactMessageTimer = null;
    }

  }


  function renderContactMessage() {

    if (
      !contactMessage ||
      !contactIsActive()
    ) {
      clearContactTimer();
      return;
    }


    const messages =
      getContactMessages();

    const message =
      messages[
        contactMessageIndex %
        messages.length
      ];

    const copy =
      contactMessage.querySelector(
        ".room-dynamic-copy"
      );


    contactMessage.classList.add(
      "is-faded"
    );


    contactMessageTimer =
      setTimeout(
        () => {

          if (
            !copy ||
            !contactIsActive()
          ) {
            clearContactTimer();
            return;
          }


          copy.textContent =
            message.text;

          contactMessage.classList.toggle(
            "is-signature",
            message.signature
          );

          contactMessage.classList.remove(
            "is-faded"
          );


          contactMessageIndex =
            (
              contactMessageIndex + 1
            ) % messages.length;


          /*
           * Message remains visible for
           * approximately 14 seconds.
           */
          contactMessageTimer =
            setTimeout(
              renderContactMessage,
              14000
            );

        },
        900
      );

  }


  function startContactMessages() {

    clearContactTimer();

    contactMessageIndex = 0;

    if (!contactMessage) {
      return;
    }

    /*
     * First greeting appears immediately
     * when entering Contact.
     */
    const copy =
      contactMessage.querySelector(
        ".room-dynamic-copy"
      );

    const first =
      getContactMessages()[0];

    if (copy) {
      copy.textContent =
        first.text;
    }

    contactMessage.classList.remove(
      "is-signature",
      "is-faded"
    );

    contactMessageIndex = 1;

    contactMessageTimer =
      setTimeout(
        renderContactMessage,
        14000
      );

  }


  /*
   * Start when Contact is selected.
   */
  document
    .querySelectorAll(
      '[data-room-target="contact"]'
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        startContactMessages
      );

    });


  /*
   * Direct load:
   * /#contact
   *
   * openRoom() has already initialized
   * the room before this block runs.
   */
  if (
    window.location.hash === "#contact"
  ) {
    startContactMessages();
  }

}

