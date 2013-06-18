(ns clj.foray-progress.models.migration
  (:require [clojure.java.jdbc :as sql]))

(defn create-progress-records []
  (sql/with-connection (System/getenv "DATABASE_URL")
    (sql/create-table :progress
      [:id :serial "PRIMARY KEY"]
      [:chapter :integer "NOT NULL"]
      [:username :varchar "NOT NULL"]
      [:created_at :timestamp "NOT NULL" "DEFAULT CURRENT_TIMESTAMP"])))

(defn -main []
  (print "Creating database structure...") (flush)
  (create-progress-records)
  (println " done"))
