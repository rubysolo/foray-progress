(ns foray-progress.update
  (:require
    [domina :as d]
    [domina.css :as css]
    [clojure.browser.event :as event]))

(def update-button (d/by-id "update"))

(defn selected-progress []
  (first (map d/value (d/nodes (css/sel "[name=progress]:checked")))))

(event/listen
        update-button
        "click"
        (fn [evt]
            (js/alert (selected-progress))))

