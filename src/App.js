import React, { Component } from 'react';
import ParticlesBg from 'particles-bg';
import Navigation from './components/Navigation/Navigation';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Logo from  './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import './App.css';

const initialState = {
  input: '',
  imageUrl: '',
  boxes: [],
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
};

class App extends Component {
  constructor() {
    super();
    this.state = initialState;
  }

  loadUser = (data) => {
    this.setState({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
      }
    });
  };

  calculateFaceLocation = (data) => {
    const regions = data.outputs[0].data.regions;
    return regions.map(region => {
      const boundingBox = region.region_info.bounding_box;
      const topRow = boundingBox.top_row * this.state.image.height;
      const leftCol = boundingBox.left_col * this.state.image.width;
      const bottomRow = this.state.image.height - (boundingBox.bottom_row * this.state.image.height);
      const rightCol = this.state.image.width - (boundingBox.right_col * this.state.image.width);
  
      const confidence = region.data.value; // Confidence score for the detected face
  
      return {
        topRow,
        leftCol,
        bottomRow,
        rightCol,
        confidence
      };
    });
  };
  displayFaceBox = (boxes) => {
    this.setState({ boxes });
  };

  returnClarifaiJSONRequestOptions = (imageUrl) => {
    const PAT = '24f606ef23c34b02aa996be4c7820c37';
    const USER_ID = 'sbatugul';
    const APP_ID = 'test';
    const MODEL_ID = 'face-detection';
    const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';
    const IMAGE_URL = imageUrl;

    const raw = JSON.stringify({
      "user_app_id": {
        "user_id": USER_ID,
        "app_id": APP_ID
      },
      "inputs": [
        {
          "data": {
            "image": {
              "url": IMAGE_URL
            }
          }
        }
      ]
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Key ' + PAT
      },
      body: raw
    };

    return requestOptions;
  };

  makeClarifaiAPICall = () => {
    return new Promise((resolve, reject) => {
      fetch("https://api.clarifai.com/v2/models/" + 'face-detection' + "/outputs",
        this.returnClarifaiJSONRequestOptions(this.state.input)
      )
        .then((response) => response.json())
        .then((result) => {
          const boxes = [];
          const regions = result.outputs[0].data.regions;
  
          regions.forEach(region => {
            const boundingBox = region.region_info.bounding_box;
            const topRow = boundingBox.top_row * this.state.image.height;
            const leftCol = boundingBox.left_col * this.state.image.width;
            const bottomRow = this.state.image.height - (boundingBox.bottom_row * this.state.image.height);
            const rightCol = this.state.image.width - (boundingBox.right_col * this.state.image.width);
  
            boxes.push({
              topRow,
              leftCol,
              bottomRow,
              rightCol
            });
          });
  
          this.displayFaceBox(boxes);
          resolve(result);
        })
        .catch((error) => {
          console.error('Error in makeClarifaiAPICall:', error);
          reject(error);
        });
    });
  };
  

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  };

  onImageLoad = () => {
    this.setState({ image: document.getElementById('inputimage') });
  };

  onButtonSubmit = () => {
    this.setState({ imageUrl: this.state.input, boxes: [] }, () => {
      // Check if the image has loaded
      if (this.state.image) {
        this.makeClarifaiAPICall()
          .then(response => {
            if (response) {
              // Make the second API call to update user entries
              fetch('https://smartbrainbe-stdo.onrender.com/image', {
                method: 'put',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: this.state.user.id
                })
              })
                .then(secondResponse => secondResponse.json())
                .then(data => {
                  if (data.entries !== undefined) {
                    // Update the user entries in the state
                    this.setState(prevState => ({
                      user: { ...prevState.user, entries: data.entries }
                    }));
                  } else {
                    console.error('Error: "entries" property not found in the response.');
                  }
                })
                .catch(error => {
                  console.error(error);
                });
            }
          })
          .catch(error => {
            console.error(error);
          });
      } else {
        console.error('Image not loaded');
      }
    });
  };
  

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState(initialState);
    } else if (route === 'home') {
      this.setState({ isSignedIn: true });
    }
    this.setState({ route: route });
  };

  render() {
    const { isSignedIn, imageUrl, route, box } = this.state;
    return (
      <div className="App">
        <ParticlesBg type="cobweb" bg={true} />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
        {route === 'home' 
          ? <div>
              <Logo />
              <Rank name={this.state.user.name} entries={this.state.user.entries}/>
              <ImageLinkForm
                onInputChange={this.onInputChange}
                onButtonSubmit={this.onButtonSubmit}
                onImageLoad={this.onImageLoad} 
              />
              <FaceRecognition imageUrl={imageUrl} boxes={box} />
            </div>
          : (
            route === 'signin'
            ? <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
            : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
          )
        }
      </div>
    );
  }
}

export default App;
