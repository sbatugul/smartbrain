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
      box: {},
      route: 'signin',
      isSignedIn: false,
      user: {
        id: '',
        name: '',
        email: '',
        entries: 0,
        joined: ''
      }
}
class App extends Component {
  constructor() {
    super();
    this.state = initialState
  }

  loadUser = (data) => {
    this.setState({user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
  }})
  }


  calculateFaceLocation = (data) => {
    try {
      // Check if data is defined and has the expected structure
      if (data && data.outputs && data.outputs[0] && data.outputs[0].data && data.outputs[0].data.regions) {
        return data.outputs[0].data.regions.map(region => {
          const bounding_box = region.region_info.bounding_box;
          const image = document.getElementById('inputimage');
          const width = Number(image.width);
          const height = Number(image.height);
  
          return {
            leftCol: bounding_box.left_col * width,
            topRow: bounding_box.top_row * height,
            rightCol: width - bounding_box.right_col * width,
            bottomRow: height - bounding_box.bottom_row * height
          };
        });
      } else {
        console.error('Invalid data structure received from Clarifai:', data);
        return [];
      }
    } catch (error) {
      console.error('Error in calculateFaceLocation:', error);
      return [];
    }
  };
  
  

  displayFaceBox = (box) => {
    this.setState({box: box})
  }

  returnClarifaiJSONRequestOptions = (imageUrl) => {
    const PAT = 'caa66be1dd564066b35bd67a7361c37b';
    const USER_ID = 'sbatugul';
    const APP_ID = 'test';
    const MODEL_ID = 'face-detection';
    const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';
    const BASE_URL = 'https://api.clarifai.com/v2/models/face-detection/outputs';
  
    const queryParams = new URLSearchParams({
      'user_app_id[user_id]': USER_ID,
      'user_app_id[app_id]': APP_ID,
    });
  
    queryParams.append('inputs[0][data][image][url]', imageUrl);
  
    const url = `${BASE_URL}?${queryParams}`;
  
    const requestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Key ${PAT}`,
        'Content-Type': 'application/json', // Add this line
      },
    };
  
    return { url, requestOptions };
  };


  makeClarifaiAPICall = () => {
    return new Promise((resolve, reject) => {
      const { url, requestOptions } = this.returnClarifaiJSONRequestOptions(this.state.input);
  
      fetch(url, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          console.log('Clarifai API Response:', result);
          this.displayFaceBox(this.calculateFaceLocation(result));
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

  onButtonSubmit = () => {
    this.setState({ imageUrl: this.state.input }, () => {
      this.makeClarifaiAPICall()
        .then(response => {
          if (response) {
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
    });
  };
  
  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState(initialState)
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  render() {
    const { isSignedIn, imageUrl, route, box } = this.state
    return (
      <div className="App">
        <ParticlesBg type="cobweb" bg={true} />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
        { route === 'home' 
          ? <div>
              <Logo />
              <Rank name={this.state.user.name} entries={this.state.user.entries}/>
              <ImageLinkForm
                onInputChange={this.onInputChange}
                onButtonSubmit={this.onButtonSubmit}
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
