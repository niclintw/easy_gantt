describe("Test framework",function(){
  it("should load",function(){
    expect(true).toBe(true);
    // expect(false).toBe(true);
  });
  
  it("should start after gantt is loaded",function(){
    expect($(".gantt_data_area").length).toBe(1);
  });
  it("should handle long tests",function(done){
    setTimeout(function(){
      expect(true).toBe(true);
      done();
    },100);
  });
});