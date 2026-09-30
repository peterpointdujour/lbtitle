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
   LB AMBIENT ROOM ENGINE
   Shared room-message controller
   ========================================================= */

if (lbRoomShell) {

  const ambientRooms = {

    contact: {

      greeting(hour) {

        if (hour < 12) {
          return "Good morning. We're here to help.";
        }

        if (hour < 17) {
          return "Good afternoon. We're here to help.";
        }

        return "Good evening. We're here to help.";
      },

      messages: [
        "Real people. Real support.",
        "Questions are where solutions begin.",
        "Title. Lien. Tag. Dealer. One place.",
        "A smoother road starts with the right next step.",
        "Powered by VALRYN OS.",
        {
          text: "Make them ask how.",
          signature: true
        },
        "LB TITLE · EST. 2014"
      ]

    },


    title: {

      greeting(hour) {

        if (hour < 12) {
          return "Good morning. Let's get the paperwork moving.";
        }

        if (hour < 17) {
          return "Good afternoon. Title help starts here.";
        }

        return "Good evening. Let's get your next step clear.";
      },

      messages: [
        "Ownership starts with the right paperwork.",
        "Transfer. Replace. Rebuild.",
        "Clear paperwork. Clear next steps.",
        "Your vehicle. Your title. Handled.",
        "Powered by VALRYN OS.",
        {
          text: "Make them ask how.",
          signature: true
        },
        "LB TITLE · EST. 2014"
      ]

    }

  };


  const ambientState = new Map();


  function normalizeAmbientMessage(item) {

    if (typeof item === "string") {
      return {
        text: item,
        signature: false
      };
    }

    return {
      text: item.text,
      signature: Boolean(item.signature)
    };

  }


  function getAmbientMessages(roomName) {

    const config =
      ambientRooms[roomName];

    if (!config) {
      return [];
    }

    const hour =
      new Date().getHours();

    return [
      {
        text: config.greeting(hour),
        signature: false
      },
      ...config.messages.map(
        normalizeAmbientMessage
      )
    ];

  }


  function roomIsActive(roomName) {

    const room =
      document.querySelector(
        `[data-room="${roomName}"]`
      );

    return Boolean(
      room &&
      !room.hidden &&
      room.classList.contains(
        "is-active"
      )
    );

  }


  function clearAmbientTimer(roomName) {

    const state =
      ambientState.get(roomName);

    if (
      state &&
      state.timer
    ) {
      clearTimeout(state.timer);
      state.timer = null;
    }

  }


  function renderAmbientMessage(roomName) {

    const state =
      ambientState.get(roomName);

    if (
      !state ||
      !state.element ||
      !roomIsActive(roomName)
    ) {
      clearAmbientTimer(roomName);
      return;
    }

    const messages =
      getAmbientMessages(roomName);

    if (!messages.length) {
      return;
    }

    const message =
      messages[
        state.index %
        messages.length
      ];

    const copy =
      state.element.querySelector(
        ".room-dynamic-copy"
      );

    state.element.classList.add(
      "is-faded"
    );

    state.timer =
      setTimeout(
        () => {

          if (
            !copy ||
            !roomIsActive(roomName)
          ) {
            clearAmbientTimer(roomName);
            return;
          }

          copy.textContent =
            message.text;

          state.element.classList.toggle(
            "is-signature",
            message.signature
          );

          state.element.classList.remove(
            "is-faded"
          );

          state.index =
            (
              state.index + 1
            ) % messages.length;

          state.timer =
            setTimeout(
              () => {
                renderAmbientMessage(
                  roomName
                );
              },
              14000
            );

        },
        900
      );

  }


  function startAmbientRoom(roomName) {

    const state =
      ambientState.get(roomName);

    if (!state || !state.element) {
      return;
    }

    clearAmbientTimer(roomName);

    const messages =
      getAmbientMessages(roomName);

    if (!messages.length) {
      return;
    }

    const first =
      messages[0];

    const copy =
      state.element.querySelector(
        ".room-dynamic-copy"
      );

    if (copy) {
      copy.textContent =
        first.text;
    }

    state.element.classList.toggle(
      "is-signature",
      first.signature
    );

    state.element.classList.remove(
      "is-faded"
    );

    state.index =
      messages.length > 1 ? 1 : 0;

    state.timer =
      setTimeout(
        () => {
          renderAmbientMessage(
            roomName
          );
        },
        14000
      );

  }


  Object.keys(
    ambientRooms
  ).forEach((roomName) => {

    const element =
      document.querySelector(
        `[data-room-message="${roomName}"]`
      );

    ambientState.set(
      roomName,
      {
        element,
        timer: null,
        index: 0
      }
    );


    document
      .querySelectorAll(
        `[data-room-target="${roomName}"]`
      )
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {
            startAmbientRoom(
              roomName
            );
          }
        );

      });

  });


  const initialRoom =
    window.location.hash
      .replace("#", "")
      .trim();

  if (
    initialRoom &&
    ambientRooms[initialRoom]
  ) {
    startAmbientRoom(
      initialRoom
    );
  }

}

