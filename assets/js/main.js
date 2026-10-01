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


    document.dispatchEvent(
      new CustomEvent(
        "lb:roomchange",
        {
          detail: {
            roomName
          }
        }
      )
    );

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

    home: {

      greeting(hour) {

        if (hour < 12) {
          return "Good morning. Welcome to LB Title.";
        }

        if (hour < 17) {
          return "Good afternoon. Welcome to LB Title.";
        }

        return "Good evening. Welcome to LB Title.";
      },

      messages: [
        "Your automotive paperwork. Handled.",
        "Title. Lien. Tag. Dealer support.",
        "Built for vehicle owners and automotive professionals.",
        "Clear next steps start here.",
        "Serving automotive needs since 2014.",
        "Powered by VALRYN OS.",
        {
          text: "Make them ask how.",
          signature: true
        },
        "LB TITLE · EST. 2014"
      ]

    },


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

    },


    lien: {

      greeting(hour) {

        if (hour < 12) {
          return "Good morning. Let's get the lien paperwork moving.";
        }

        if (hour < 17) {
          return "Good afternoon. Lien help starts here.";
        }

        return "Good evening. Let's get your next step clear.";
      },

      messages: [
        "Mechanical liens. Tow liens. Clear next steps.",
        "Documentation matters.",
        "Resolve the paperwork. Keep things moving.",
        "Clear records make the road ahead easier.",
        "Vehicle lien support when you need it.",
        "Powered by VALRYN OS.",
        {
          text: "Make them ask how.",
          signature: true
        },
        "LB TITLE · EST. 2014"
      ]

    },


    tag: {

      greeting(hour) {

        if (hour < 12) {
          return "Good morning. Let's get your tag request moving.";
        }

        if (hour < 17) {
          return "Good afternoon. Tag help starts here.";
        }

        return "Good evening. Let's get your tag request started.";
      },

      messages: [
        "Transport. Paper. Transfer.",
        "The right tag for the road ahead.",
        "Simple paperwork. Clear next steps.",
        "Vehicle tag support without the guesswork.",
        "Start here. We'll help with the next step.",
        "Powered by VALRYN OS.",
        {
          text: "Make them ask how.",
          signature: true
        },
        "LB TITLE · EST. 2014"
      ]

    },


    dealer: {

      greeting(hour) {

        if (hour < 12) {
          return "Good morning. Dealer support starts here.";
        }

        if (hour < 17) {
          return "Good afternoon. Dealer support starts here.";
        }

        return "Good evening. Dealer support starts here.";
      },

      messages: [
        "Built for automotive professionals.",
        "Business moves faster with clear next steps.",
        "Licensing. Registration. Inspections. Support.",
        "A dedicated service lane for your business.",
        "Your business. One service lane.",
        "Powered by VALRYN OS.",
        {
          text: "Make them ask how.",
          signature: true
        },
        "LB TITLE · EST. 2014"
      ]

    },


    "vehicle-check": {

      greeting(hour) {

        if (hour < 12) {
          return "Good morning. Vehicle intelligence is being prepared.";
        }

        if (hour < 17) {
          return "Good afternoon. Vehicle intelligence is being prepared.";
        }

        return "Good evening. Vehicle intelligence is being prepared.";
      },

      messages: [
        "Verify before you rely.",
        "Better data. Better decisions.",
        "Vehicle-data capability is planned.",
        "Provider integration is not yet live.",
        "We activate data services only when the source is ready.",
        "Powered by VALRYN OS.",
        {
          text: "Make them ask how.",
          signature: true
        },
        "LB TITLE · EST. 2014"
      ]

    },


    about: {

      greeting(hour) {

        if (hour < 12) {
          return "Good morning. Welcome to LB Title.";
        }

        if (hour < 17) {
          return "Good afternoon. Welcome to LB Title.";
        }

        return "Good evening. Welcome to LB Title.";
      },

      messages: [
        "Serving automotive needs since 2014.",
        "People. Vehicles. Solutions.",
        "A smoother road starts with clear support.",
        "Built around service and straightforward next steps.",
        "Title. Lien. Tag. Dealer support.",
        "Powered by VALRYN OS.",
        {
          text: "Make them ask how.",
          signature: true
        },
        "LB TITLE · EST. 2014"
      ]

    },


    reviews: {

      greeting(hour) {

        if (hour < 12) {
          return "Good morning. Real feedback is earned over time.";
        }

        if (hour < 17) {
          return "Good afternoon. Real feedback is earned over time.";
        }

        return "Good evening. Real feedback is earned over time.";
      },

      messages: [
        "Real customers. Real experiences.",
        "Verified reviews will appear as they are collected.",
        "Trust is built, not fabricated.",
        "Feedback helps us improve.",
        "Service first. Reputation follows.",
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



/* =========================================================
   LB APPROVED REVIEW DISPLAY
   Public source: assets/data/reviews.json
   ========================================================= */

(() => {

  const reviewRegion =
    document.querySelector("#approved-reviews");

  const reviewList =
    document.querySelector("#approved-reviews-list");


  if (!reviewRegion || !reviewList) {
    return;
  }


  const allowedServices =
    new Set([
      "Title",
      "Lien",
      "Tag",
      "Dealer",
      "Other"
    ]);


  function validReview(review) {

    if (
      !review
      || typeof review !== "object"
    ) {
      return false;
    }


    if (
      typeof review.name !== "string"
      || !review.name.trim()
    ) {
      return false;
    }


    if (
      typeof review.service !== "string"
      || !allowedServices.has(
        review.service
      )
    ) {
      return false;
    }


    if (
      !Number.isInteger(review.rating)
      || review.rating < 1
      || review.rating > 5
    ) {
      return false;
    }


    if (
      typeof review.review !== "string"
      || !review.review.trim()
    ) {
      return false;
    }


    if (
      review.approved !== true
    ) {
      return false;
    }


    return true;
  }


  function makeElement(
    tag,
    className,
    text
  ) {

    const element =
      document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }


  function buildReviewCard(review) {

    const card =
      makeElement(
        "article",
        "approved-review-card"
      );


    const rating =
      makeElement(
        "div",
        "approved-review-rating",
        "★".repeat(review.rating)
      );

    rating.setAttribute(
      "aria-label",
      `${review.rating} out of 5 stars`
    );


    const quote =
      makeElement(
        "blockquote",
        "approved-review-quote",
        review.review.trim()
      );


    const footer =
      makeElement(
        "footer",
        "approved-review-meta"
      );


    const name =
      makeElement(
        "strong",
        "",
        review.name.trim()
      );


    const service =
      makeElement(
        "span",
        "",
        `${review.service} Service`
      );


    footer.append(
      name,
      service
    );


    card.append(
      rating,
      quote,
      footer
    );


    return card;
  }


  async function loadApprovedReviews() {

    try {

      const response =
        await fetch(
          "assets/data/reviews.json",
          {
            cache: "no-store"
          }
        );


      if (!response.ok) {
        return;
      }


      const payload =
        await response.json();


      if (
        !payload
        || payload.version !== 1
        || !Array.isArray(payload.reviews)
      ) {
        return;
      }


      const approved =
        payload.reviews.filter(
          validReview
        );


      if (!approved.length) {
        return;
      }


      let currentIndex = 0;
      let rotationTimer = null;

      const rotationDelay = 9000;

      const reduceMotion =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        );


      function reviewsRoomIsActive() {

        const room =
          document.querySelector(
            '[data-room="reviews"]'
          );

        return Boolean(
          room
          && !room.hidden
          && room.classList.contains(
            "is-active"
          )
        );

      }


      function renderCurrentReview() {

        const review =
          approved[currentIndex];

        if (!review) {
          return;
        }

        reviewList.replaceChildren(
          buildReviewCard(review)
        );

      }


      function clearRotationTimer() {

        if (rotationTimer) {
          clearTimeout(rotationTimer);
          rotationTimer = null;
        }

      }


      function scheduleRotation() {

        clearRotationTimer();

        if (
          approved.length <= 1
          || !reviewsRoomIsActive()
        ) {
          return;
        }

        rotationTimer =
          setTimeout(
            rotateReview,
            rotationDelay
          );

      }


      function rotateReview() {

        clearRotationTimer();

        if (
          approved.length <= 1
          || !reviewsRoomIsActive()
        ) {
          return;
        }

        currentIndex =
          (currentIndex + 1)
          % approved.length;


        if (reduceMotion.matches) {

          renderCurrentReview();
          scheduleRotation();

          return;

        }


        reviewList.classList.add(
          "is-fading"
        );


        setTimeout(() => {

          renderCurrentReview();

          reviewList.classList.remove(
            "is-fading"
          );

          scheduleRotation();

        }, 550);

      }


      document.addEventListener(
        "lb:roomchange",
        (event) => {

          const roomName =
            event.detail?.roomName;


          if (roomName === "reviews") {

            scheduleRotation();

            return;
          }


          clearRotationTimer();

        }
      );


      renderCurrentReview();

      reviewRegion.hidden = false;

      scheduleRotation();

    } catch (error) {

      /*
       * Fail closed.
       *
       * Review display is optional public content.
       * A loading/parsing failure must not affect
       * the rest of the LB Title experience.
       */

    }

  }


  loadApprovedReviews();

})();
