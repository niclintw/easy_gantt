describe("Working time helper", function () {
  var helper;
  var defHours;
  var workingDays;
  var events;
  var iso = "YYYY-MM-DD";

  beforeAll(function () {
    helper = gantt._working_time_helper;
    defHours = helper.defHours;
    helper.defHours = 8;
    workingDays = helper.days;
    helper.days = {0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false};
    events = helper.dates;
    helper.dates = [];
  });
  afterAll(function () {
    helper.defHours = defHours;
    helper.days = workingDays;
    helper.dates = events;
  });
  beforeEach(function () {
    helper._cache = {};
  });

  it("should mark 29.6.2016 as weekend", function () {
    expect(helper.is_weekend(moment("2016-05-29"))).toBe(true);
  });
  it("should mark 30.6.2016 as non-weekend", function () {
    expect(helper.is_weekend(moment("2016-05-30"))).toBe(false);
  });
  it("should return 8h for working day", function () {
    expect(helper.get_working_hours(moment("2016-06-03"))).toBe(8);
  });
  it("should return 0h for weekend", function () {
    expect(helper.get_working_hours(moment("2016-06-04"))).toBe(0);
  });
  describe("date ranges", function () {
    var start = moment("2016-06-01");
    var end = moment("2016-06-30");
    it("should return 21d for June", function () {
      expect(helper.get_work_units_between(start, end, "day")).toBe(21);
    });
    it("should return 168h for June", function () {
      expect(helper.get_work_units_between(start, end, "hour")).toBe(168);
    });
  });
  describe("date ranges with _end", function () {
    var start = moment("2016-06-01");
    var end = moment("2016-06-30");
    end._isEndDate = true;
    it("should return 22d for June", function () {
      expect(helper.get_work_units_between(start, end, "day")).toBe(22);
    });
    it("should return 176h for June", function () {
      expect(helper.get_work_units_between(start, end, "hour")).toBe(176);
    });
  });
  describe("inverted date ranges with _end", function () {
    var start = moment("2016-07-15");
    var end = moment("2016-06-30");
    end._isEndDate = true;
    it("should return -10d for half July", function () {
      expect(helper.get_work_units_between(start, end, "day")).toBe(-10);
    });
    it("should return -80h for half July", function () {
      expect(helper.get_work_units_between(start, end, "hour")).toBe(-80);
    });
  });
  describe("float date ranges with _end", function () {
    var start = moment("2016-06-01").add(8, "hours");
    var end = moment("2016-06-30").add(8, "hours");
    end._isEndDate = true;
    it("should return 22d for June", function () {
      expect(helper.get_work_units_between(start, end, "day")).toBe(22);
    });
    it("should return 176h for June", function () {
      expect(helper.get_work_units_between(start, end, "hour")).toBe(176);
    });
  });
  describe("float date ranges on weekend", function () {
    var start = moment("2016-05-22").add(6, "hours");
    var end = moment("2016-05-30").add(6, "hours");
    it("should return 5.25d", function () {
      expect(helper.get_work_units_between(start, end, "day")).toBe(5.25);
    });
    it("should return 42h", function () {
      expect(helper.get_work_units_between(start, end, "hour")).toBe(42);
    });
  });
  describe("addWorkingTime()", function () {
    var start = moment("2016-05-20");
    var start2 = moment(start);
    start2._isEndDate = true;
    it("should return 2016-05-24 after adding 2 days", function () {
      expect(helper.add_worktime(start, 2, "day", false).format(iso)).toBe("2016-05-24");
    });
    it("should return 2016-05-23 after adding 2 days with _end", function () {
      expect(helper.add_worktime(start, 2, "day", true).format(iso)).toBe("2016-05-23");
    });
    it("should return 2016-05-13 after subtracting 5 days", function () {
      expect(helper.add_worktime(start, -5, "day", false).format(iso)).toBe("2016-05-13");
    });
    it("should return 2016-05-12 after subtracting 5 days", function () {
      expect(helper.add_worktime(start, -5, "day", true).format(iso)).toBe("2016-05-12");
    });
    it("should return 2016-05-25 after adding 2 days with start._end", function () {
      expect(helper.add_worktime(start2, 2, "day", false).format(iso)).toBe("2016-05-25");
    });
    it("should return 2016-05-16 after subtracting 5 days with start._end", function () {
      expect(helper.add_worktime(start2, -5, "day", false).format(iso)).toBe("2016-05-16");
    });
    it("should return 2016-05-24+12 after adding 2 days", function () {
      var start12=moment(start).add(12,"hours");
      expect(helper.add_worktime(start12, 2, "day", false).format()).toBe("2016-05-24T12:00:00+02:00");
    });
  });
});
