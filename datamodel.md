# Data Model

## Collections

### Name: SchoolDist

| FieldName     | DataType     |
| ------------- | ------------- |
| SchoolDistId | int |
| Name | char(50) |
| State | char(2) |

### Name: SchoolDistContacts

| FieldName     | DataType     |
| ------------- | ------------- |
| SchoolDistId | int |
| FirstName | char(50) |
| LastName | char(50) |
| Phone | char(50) |
| Email | char(50) |
| Title | char(2) |

### Name: Bus
| FieldName     | DataType     |
| ------------- | ------------- |
| BusId | int |
| RouterId | char(50) |
| IMSI | char(50) |
| IMEI | char(50) |

### Name: BusRoute
| FieldName     | DataType     |
| ------------- | ------------- |
| BusId | int |
| RouteId | int |

### Name: Route
| FieldName     | DataType     |
| ------------- | ------------- |
| RouteId | int |
| RouteNo | char(50) |
| SchoolName | char(50) |
| RouteStopAddress | char(50) |
| RouteStopCoord | char(50) |
| RouteStopAMTime | char(50) |
| RouteStopPMTime | char(50) |

### Name: BusFTRoute
| FieldName     | DataType     |
| ------------- | ------------- |
| BusId | int |
| FieldTrip | char(50) |
| RouteCoord | char(50) |

### Name: StudentRoute
| FieldName     | DataType     |
| ------------- | ------------- |
| StudentId | int |
| RouteId | int |

### Name: Student
| FieldName     | DataType     |
| ------------- | ------------- |
| StudentId | int |
| RegParentPhoneNo1 | char(50) |
| RegParentPhoneNo2 | char(50) |
| RegParentEmail1 | char(50) |
| RegParentEmail2 | char(50) |


### Name: BusStatus
| FieldName     | DataType     |
| ------------- | ------------- |
| BusId | int |
| InTimestamp | datetime |
| OutTimeStamp | char(50) |
| Coord | char(50) |
| Activate | bool

### Name: AlertConfig
| FieldName     | DataType     |
| ------------- | ------------- |
| StudentId | int |
| RouteStopAddress | char(50) |

### Name: Alerts
| FieldName     | DataType     |
| ------------- | ------------- |
| StudentId | int |
| TimeStamp | char(50) |

### Name: BusContact
| FieldName     | DataType     |
| ------------- | ------------- |
| BusId | int |
| DriverId | int |

### Name:StudentRouteAttendance
| FieldName     | DataType     |
| ------------- | ------------- |
| RouteId | int |
| StudentId | int |