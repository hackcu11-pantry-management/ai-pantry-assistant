import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserPantry } from "../../redux/actions/productActions";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import "./CalendarPage.css";

// Format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateStr;
  }
};

// Get CSS class based on expiration status
const getExpirationClass = (expirationDate) => {
  if (!expirationDate) return "";
  
  const today = new Date();
  const daysRemaining = Math.floor(
    (expirationDate - today) / (1000 * 60 * 60 * 24)
  );
  
  if (daysRemaining < 0) return "expired";
  if (daysRemaining < 3) return "expiring-soon";
  if (daysRemaining < 7) return "expiring-week";
  return "not-expiring";
};

// Event Details Popup Component
const EventDetailsPopup = ({ event, position, onClose }) => {
  const popupRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Update mobile status on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!event) return null;

  const item = event.extendedProps.item;
  
  // On mobile, we'll use CSS to center the popup instead of positioning it near the event
  const popupStyle = isMobile 
    ? {} // Empty style object, CSS will handle positioning on mobile
    : { top: `${position.y}px`, left: `${position.x}px` };
  
  return (
    <>
      {isMobile && <div className="popup-overlay" onClick={onClose}></div>}
      <div 
        className="event-details-popup" 
        style={popupStyle}
        ref={popupRef}
      >
        <div className="popup-header">
          <h3>{item.productname}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="popup-content">
          {item.image && (
            <div className="popup-image-container">
              <img src={item.image} alt={item.productname} className="popup-image" />
            </div>
          )}
          <div className="popup-details">
            <p><strong>Quantity:</strong> {item.quantity} {item.quantitytype || "items"}</p>
            {item.productcategory && <p><strong>Category:</strong> {item.productcategory}</p>}
            {item.expiration_date && (
              <p className={`expiration-date ${getExpirationClass(new Date(item.expiration_date))}`}>
                <strong>Expires:</strong> {formatDate(item.expiration_date)}
              </p>
            )}
            {item.purchase_date && <p><strong>Purchased:</strong> {formatDate(item.purchase_date)}</p>}
            {item.notes && <p><strong>Notes:</strong> {item.notes}</p>}
          </div>
        </div>
      </div>
    </>
  );
};

const CalendarPage = () => {
  const dispatch = useDispatch();
  const pantryItems = useSelector((state) => state.productState.products);
  const isAuthenticated = useSelector(
    (state) => !!state.userState.loginResult?.token,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  // Fetch pantry items when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      setError(null);
      dispatch(getUserPantry())
        .then(() => setLoading(false))
        .catch((err) => {
          setError(err.message || "Failed to load pantry items");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [dispatch, isAuthenticated]);

  // Helper function to parse date strings from API
  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    // Handle different date formats
    // Format: "Sun, 02 Mar 2025 00:00:00 GMT"
    try {
      return new Date(dateStr);
    } catch (e) {
      console.error("Error parsing date:", dateStr, e);
      return null;
    }
  };

  // Convert pantry items to calendar events when pantryItems changes
  useEffect(() => {
    console.log("Pantry items for calendar:", pantryItems);

    if (pantryItems && pantryItems.length > 0) {
      const events = pantryItems
        .filter((item) => {
          const hasExpDate = !!item.expiration_date;
          if (!hasExpDate) {
            console.log("Item missing expiration date:", item);
          }
          return hasExpDate;
        })
        .map((item) => {
          const expDate = parseDate(item.expiration_date);

          if (!expDate) {
            console.log("Failed to parse expiration date for item:", item);
            return null;
          }

          const event = {
            title: `${item.productname} expires`,
            date: expDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
            backgroundColor: getColorForDaysRemaining(expDate),
            extendedProps: {
              quantity: `${item.quantity} ${item.quantitytype || "items"}`,
              category: item.productcategory || "Other",
              item: item, // Store the entire item for the popup
            },
          };

          console.log("Created calendar event:", event);
          return event;
        })
        .filter((event) => event !== null); // Remove any events that failed to parse

      console.log("Final calendar events:", events);
      setCalendarEvents(events);
    }
  }, [pantryItems]);

  // Helper function to determine color based on days until expiration
  const getColorForDaysRemaining = (expirationDate) => {
    if (!expirationDate) return "#6c757d"; // Default gray

    const today = new Date();
    const daysRemaining = Math.floor(
      (expirationDate - today) / (1000 * 60 * 60 * 24),
    );

    console.log("Days remaining:", daysRemaining, "for date:", expirationDate);

    if (daysRemaining < 0) return "#dc3545"; // Expired - red
    if (daysRemaining < 3) return "#fd7e14"; // Expiring soon - orange
    if (daysRemaining < 7) return "#ffc107"; // Expiring this week - yellow
    return "#28a745"; // Not expiring soon - green
  };

  // Custom event render to show more details
  const renderEventContent = (eventInfo) => {
    return (
      <div className="calendar-event">
        <b>{eventInfo.event.title}</b>
        <div className="event-details">
          {eventInfo.event.extendedProps.quantity}
        </div>
      </div>
    );
  };

  // Handle event click
  const handleEventClick = (clickInfo) => {
    // Get position for popup (near the event)
    const rect = clickInfo.el.getBoundingClientRect();
    
    // Calculate available space
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Default position (below the event)
    let xPos = rect.left + window.scrollX;
    let yPos = rect.bottom + window.scrollY;
    
    // Check if popup would go off the right edge
    // Assuming popup width is 300px (from CSS)
    const popupWidth = 300;
    if (xPos + popupWidth > viewportWidth + window.scrollX) {
      // Align to right edge with 10px padding
      xPos = viewportWidth + window.scrollX - popupWidth - 10;
    }
    
    // Ensure popup doesn't start off-screen to the left
    if (xPos < window.scrollX) {
      xPos = window.scrollX + 10;
    }
    
    // Check if there's enough space below, if not, position above
    // Estimate popup height (can be adjusted based on actual content)
    const estimatedPopupHeight = 300;
    if (yPos + estimatedPopupHeight > viewportHeight + window.scrollY && 
        rect.top > estimatedPopupHeight) {
      // Position above the event if there's enough space
      yPos = rect.top + window.scrollY - estimatedPopupHeight;
    }
    
    setPopupPosition({
      x: xPos,
      y: yPos
    });
    
    // Set the selected event
    setSelectedEvent(clickInfo.event);
  };

  // Close the popup
  const handleClosePopup = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="calendar-container">
      <h1>Expiration Calendar</h1>
      <p>Track when your food items will expire</p>

      {loading ? (
        <div className="loading">Loading your pantry items...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="calendar-legend">
            <div className="legend-item">
              <span className="color-box expired"></span> Expired
            </div>
            <div className="legend-item">
              <span className="color-box expiring-soon"></span> Expiring in 3
              days
            </div>
            <div className="legend-item">
              <span className="color-box expiring-week"></span> Expiring in 7
              days
            </div>
            <div className="legend-item">
              <span className="color-box not-expiring"></span> Not expiring soon
            </div>
          </div>

          <div className="calendar-wrapper">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              eventContent={renderEventContent}
              eventClick={handleEventClick}
              height="auto"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek",
              }}
            />
          </div>

          {calendarEvents.length === 0 && !loading && (
            <div className="no-items">
              <p>No items with expiration dates found in your pantry.</p>
              <p>Debug info: Found {pantryItems.length} pantry items total.</p>
            </div>
          )}

          {selectedEvent && (
            <EventDetailsPopup 
              event={selectedEvent} 
              position={popupPosition} 
              onClose={handleClosePopup} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default CalendarPage;
