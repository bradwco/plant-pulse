import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseApp = initializeApp({
  apiKey: "AIzaSyDJoqbItPGEzTbMA_sovO13dbmSYxV6Z28",
  authDomain: "plant-pulse-c6385.firebaseapp.com",
  projectId: "plant-pulse-c6385",
  storageBucket: "plant-pulse-c6385.firebasestorage.app",
  messagingSenderId: "797968629781",
  appId: "1:797968629781:web:70e91d5cae6734eeee0e1c",
  measurementId: "G-43PHYM01Z8",
});

const auth = getAuth(firebaseApp);
document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("loginSubmit");
  if (loginButton) {
    loginButton.addEventListener("click", (event) => {
      event.preventDefault();
      loginEmailPassword();
      const user = auth.currentUser;
      if (user && user.emailVerified) {
        window.location.replace("/home");
      }
    });
  }
  const signupButton = document.getElementById("signupSubmit");
  if (signupButton) {
    signupButton.addEventListener("click", (event) => {
      event.preventDefault();
      createAccount();
    });
  }
  const createAccountLink = document.getElementById("createAccount");
  if (createAccountLink) {
    createAccountLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.replace("/signup");
    });
  }
  const logoutButton = document.getElementById("log-out");
  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
    });
  }
  const galleryNavBut = document.getElementById("galleryLink");
  if (galleryNavBut) {
    galleryNavBut.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.replace("/gallery");
    });
  }
  const homeNavBut = document.getElementById("homeLink");
  if (homeNavBut) {
    homeNavBut.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.replace("/home");
    });
  }

  const analyticsNavBut = document.getElementById("analyticsLink");
  if (analyticsNavBut) {
    analyticsNavBut.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.replace("/analytics");
    });
  }
  const loginExisting = document.getElementById("loginLink");
  if (loginExisting) {
    loginExisting.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.replace("/login");
    });
  }
});

const loginEmailPassword = async () => {
  const loginEmail = document.getElementById("loginEmail").value;
  const loginPassword = document.getElementById("loginPass").value;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      loginEmail,
      loginPassword
    );
    const user = userCredential.user;

    if (!user.emailVerified) {
      alert("Please verify your email before logging in.");
      await signOut(auth);
      return;
    } else {
      console.log("User logged in:", user);
    }
  } catch (error) {
    console.error("Error logging in:", error.message);
    // alert("Login Error: " + error.message);
  }
};

const createAccount = async () => {
  const signupEmail = document.getElementById("signupEmail").value.trim();
  const signupPassword = document.getElementById("signupPass").value;
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      signupEmail,
      signupPassword
    );
    console.log("User Created:", userCredential.user);

    await sendEmailVerification(userCredential.user);
    alert(
      "Verification email sent! Please check your inbox before logging in."
    );
    await signOut(auth);
    window.location.replace("/login");
    alert("Please verify your email");
    console.log("User Created (Verification Pending):", user);
  } catch (error) {
    console.error("Error Creating User:", error.message);
  }
};

const logout = async () => {
  await signOut(auth);
};

let firstLoad = true;

const monitorAuthState = () => {
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user);

    const currentPage = window.location.pathname;

    if (user) {
      console.log("User is logged in:", user);

      if (!user.emailVerified) {
        signOut(auth);
        window.location.replace("/login");
        return;
      }
      if (currentPage === "/gallery") {
        displayUserPlants();
      }
      // If user is on login page but already logged in, redirect to home
      if (currentPage === "/login") {
        window.location.replace("/home");
      }
    } else {
      console.log("User is logged out.");

      // If user is not logged in and not already on login page, redirect them
      if (currentPage !== "/login" && currentPage !== "/signup") {
        if (!firstLoad) alert("You have logged out!");
        window.location.replace("/login");
      }
    }

    firstLoad = false;
  });
};

monitorAuthState();

//DATA BASE
const db = getFirestore();
const storage = getStorage(); //for images

document.addEventListener("DOMContentLoaded", () => {
  const addButton = document.getElementById("submitFile");
  const fileInput = document.getElementById("fileInput");
  let plantName = "";
  let selectedFile = null;
  if (addButton) {
    addButton.addEventListener("click", async (event) => {
      event.preventDefault();
      //begin loading
      toggleLoading(true);
      plantName = document.getElementById("plantName").value;
      selectedFile = fileInput.files[0];

      if (!selectedFile) {
        alert("Please select an image first.");
        return;
      }

      // Form data is used to send image to python
      const formData = new FormData();
      formData.append("image", selectedFile);

      try {
        // send image to backend
        const response = await fetch("/analyze", {
          method: "POST",
          body: formData,
        });

        const data = await response.json(); // get data from backend

        // Pass response data into another function
        uploadNewPlant(
          plantName,
          data.healthScore,
          data.aiFeedback,
          selectedFile
        );
        //end the loading
        toggleLoading(false);
      } catch (error) {
        console.error("❌ Error:", error);
      }
    });
  }
});

//Uploading new plants *Fix upload new plant to take feedback from getAiFeedback
async function uploadNewPlant(name, health, aiFeedback, imageFile) {
  const user = auth.currentUser;

  if (!user) {
    console.error("❌ No authenticated user found.");
    alert("You must be logged in to upload a plant.");
    return;
  }
  const plantId = `${user.uid}_${Date.now()}`; // Unique ID based on user and timestamp
  let imageUrl = "";

  // Upload image if provided
  if (imageFile) {
    const storageRef = ref(storage, `plant_images/${user.uid}/${plantId}`);
    await uploadBytes(storageRef, imageFile);
    imageUrl = await getDownloadURL(storageRef);
  }

  // Store plant data in Firestore
  const plantRef = doc(collection(db, "plants"), plantId);
  await setDoc(plantRef, {
    uid: user.uid,
    plantId: plantId,
    name: name,
    current_health: health,
    ai_feedback: aiFeedback,
    imageUrl: imageUrl,
    last_updated: serverTimestamp(),
  });

  alert(`Plant ${name} uploaded successfully!`);
  return plantId; // Return plantId for further use if needed
}
async function displayUserPlants() {
    const user = auth.currentUser;
    
    if (!user) {
        console.error("❌ No authenticated user found.");
        alert("You must be logged in to view the gallery.");
        return;
    }

    const articlesContainer = document.getElementById("articles-container");
    if (!articlesContainer) {
        console.error("❌ Error: articles-container not found!");
        return;
    }

    // Clear previous entries before adding new ones
    articlesContainer.innerHTML = "";

    const q = query(collection(db, "plants"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log("No plants found for this user.");
        articlesContainer.innerHTML = `<p>No plants found.</p>`;
        return;
    }

    querySnapshot.forEach((doc) => {
        const plantData = doc.data();
        console.log("Fetched Plant:", plantData);

        // Create the article element
        const newArticle = document.createElement("article");

        newArticle.innerHTML = `
            <input class="articleInput" type="checkbox" name="articles" id="article${plantData.plantId}">
  const user = auth.currentUser;

  if (!user) {
    console.error("❌ No authenticated user found.");
    alert("You must be logged in to view the gallery.");
    return;
  }

  const articlesContainer = document.getElementById("articles-container");
  if (!articlesContainer) {
    console.error("❌ Error: articles-container not found!");
    return;
  }

  // Clear previous entries before adding new ones
  articlesContainer.innerHTML = "";

  const q = query(collection(db, "plants"), where("uid", "==", user.uid));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.log("No plants found for this user.");
    articlesContainer.innerHTML = `<p>No plants found.</p>`;
    return;
  }

  querySnapshot.forEach((doc) => {
    const plantData = doc.data();
    console.log("Fetched Plant:", plantData);

    // Create the article element
    const newArticle = document.createElement("article");

    newArticle.innerHTML = `;
            <input class="articleInput" type="radio" name="articles" id="article${
              plantData.plantId
            }">
            <label for="article${plantData.plantId}">
                <h2 class="crop">${plantData.name}</h2>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(plantData.current_health * 10)}%;"></div>
                </div>
            </label>
            <div class="accordion-content">
                <img src="${plantData.imageUrl || "default-image.jpg"}"/>
                     alt="${plantData.name} Image" class="accordion-image">
                <p><span class="bold" style="color: #FF6961">Health Score:</span> ${plantData.current_health}</p>
                <p><span class="bold" style="color: #77DD77">AI Feedback:</span> ${plantData.ai_feedback}</p>
            </div>
        `;

    // Append the new article to the container
    articlesContainer.appendChild(newArticle);
  });
}

function toggleLoading(isLoading) {
  let loadingElement = document.getElementById("loading");

  if (isLoading) {
    // Create the loading element if it doesn't exist
    if (!loadingElement) {
      loadingElement = document.createElement("div");
      loadingElement.id = "loading";
      loadingElement.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Loading, please wait...</p>
            `;
      document.body.appendChild(loadingElement);
    }
    loadingElement.style.display = "flex"; // Show loading animation
  } else {
    if (loadingElement) {
      loadingElement.style.display = "none"; // Hide loading animation
    }
  }
}
