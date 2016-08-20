# elth.care.sample
## Sample server that parses appointment slots

# USAGE
Usage is pretty straightforward for this sample server.
You can visit the [Sample Server](http://128.199.92.34:9000) and make a **GET** request by supplying an **id** parameter in the url.

# RESPONSE
The server's response is an array of object formatted as following

```[
  {
    "Day": "Monday",
    "Slots": [
      {
        "Start Time": "0900",
        "End Time": "1200",
        "Display String": "09:00AM - 12:00PM"
      },
      {
        "Start Time": "1200",
        "End Time": "1500",
        "Display String": "12:00PM - 03:00PM"
      },
      {
        "Start Time": "1500",
        "End Time": "1800",
        "Display String": "03:00PM - 06:00PM"
      }
    ]
  }
  ```
