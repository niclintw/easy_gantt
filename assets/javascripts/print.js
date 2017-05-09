window.ysy = window.ysy || {};
ysy.view = ysy.view || {};
ysy.view.print = {
  logoName: null,
  logo: null,
  print: function () {
    var selectedPdfTheme = $("#easy-pdf-theme").find("option:checked");
    if (selectedPdfTheme.length) {
      if (this.logo && !this.logo[0].complete) return;
      var logoData = selectedPdfTheme.data();
      if (this.logoName !== logoData.logo) {
        this.logoName = logoData.logo;
        this.logo = $('<img width="220" /><br>')
            .load(function () {
              ysy.view.print.print();
            })
            .attr("src", logoData.logo);
        return;
      }
    }

    gantt._backgroundRenderer.switchFullRender(true);
    gantt._unset_sizes();
    var $wrapper2 = $("#wrapper2");
    var $wrapper3 = $("#wrapper3");
    if (ysy.view.affix.setPosition) {
      ysy.view.affix.setPosition(0);
    }
    $("#print_area").remove();
    var $print = $('<div id="print_area"></div>').appendTo($wrapper2);

    if (this.logoName) {
      $print.append(this.logo);
      $print.append('<style>                                           \
                       .gantt_grid_head_cell, .gantt_scale_cell{       \
                          background: ' + logoData.headerColor + ' !important; \
                          color: ' + logoData.headerFontColor + ' !important;  \
                        }                                              \
                     </style>');
    }

    var fullWidth = gantt._tasks.full_width;
    var pageWidth = 450;
    var $grid = ysy.view.print.cloneGrid();
    $print.append($grid);
    var gridWidth = $grid.outerWidth();
    for (var p = -gridWidth; p < fullWidth; p += pageWidth) {
      $print.append(ysy.view.print.createStrip(p < 0 ? 0 : p, p + pageWidth));
      //p -= 2;
    }
    $wrapper3.hide();
    window.print();
    $wrapper3.show();

    $print.remove();

    //gantt._set_sizes();
    gantt._backgroundRenderer.switchFullRender(false);
    gantt._scroll_resize();
  },
  cloneGrid: function () {
    var $gantt_cont = $("#gantt_cont");
    var $grid = $gantt_cont.find(".gantt_grid").clone().addClass("gantt-print-grid");
    var $gridScale = $grid.find(".gantt_grid_scale");
    $gridScale.css({height: $gridScale.height() + 1 + "px", transform: "none"});
    return $grid;
  },
  createStrip: function (start, end) {
    if (end <= start) return null;
    var $gantt_cont = $("#gantt_cont");
    var $gantt_task = $gantt_cont.find(".gantt_task");
    var $strip = $('<div class="gantt-print-strip" style="width:' + (end - start) + 'px"></div>');
    // SCALE LINE
    $strip.append(this.cloneScales($gantt_task, start, end));

    // DATA AREA
    var $gantt_data_area = $gantt_cont.find(".gantt_data_area");
    var $data = $('<div class="gantt_data_area"></div>').css({
      height: $gantt_data_area.height() + "px",
      width: $gantt_data_area.width() + "px"
    });
    // BACKGROUND
    $data.append(this.cloneBackground($gantt_data_area, start, end));

    // LINKS
    $data.append(this.cloneLinks($gantt_data_area, start, end));

    // TASKS
    $data.append(this.cloneTasks($gantt_data_area, start, end));

    $strip.append($data);

    return $strip;
  },
  cloneScales: function ($source, start, end) {
    var $scale = $(
        '<div class="gantt-print-scale gantt_task_scale"></div>');
    for (var l = 0; l < 2; l++) {
      var lines = $source.find(".gantt_scale_line");
      var oldLine = $(lines[l]);
      var cells = oldLine.find(".gantt_scale_cell");
      var $line = $('<div class="gantt_scale_line gantt-print-scale-line"></div>');
      $line[0].style.height = lines[l].style.height;
      $line[0].style.lineHeight = lines[l].style.lineHeight;
      //$line.style.height=oldLine.style.height;
      //$line.style.lineHeight=oldLine.style.lineHeight;
      //$line.height(oldLine.height());
      var leftPointer = 0;
      var first = false;
      for (var i = 0; i < cells.length; i++) {
        var oldCell = $(cells[i]);
        var width = oldCell.outerWidth();
        if (leftPointer < end && leftPointer + width > start) {
          var $cell = oldCell.clone();
          $line.append($cell);
          if (first === false) {
            first = true;
            $cell.css("margin-left", (leftPointer - start) + "px");
          }
        }
        leftPointer += width;
      }
      $line.width(leftPointer);

      $scale.append($line);
    }
    return $scale;
  },
  cloneBackground: function ($source, start, end) {
    var $gantt_task_bg = $source.find('.gantt_task_bg');
    var fullWidth = $gantt_task_bg.width();
    var $background = $('<div class="gantt_task_bg gantt-print-bg" style="width:' + (end - start) + 'px;"></div>');
    var canvases = $gantt_task_bg.find("canvas");
    var nextRound = true;
    var leftPointer = 0;
    for (var i = 0; i < canvases.length; i++) {
      var oldCanvas = $(canvases[i]);
      var canvasWidth = oldCanvas.width();
      if (nextRound) {
        var canvasHeight = oldCanvas.height();
        var $canvas = $('<canvas class="gantt-print-bg-canvas" width="' + (end - start) + '" \
            height="' + canvasHeight + '" \
            style="width:' + (end - start) + 'px;height:' + canvasHeight + 'px;"></canvas>');
        var ctx = $canvas[0].getContext('2d');
        $background.append($canvas);
        nextRound = false;
      }

      if (leftPointer < end && leftPointer + canvasWidth > start) {
        var realStart = Math.max(leftPointer, start);
        //ysy.log.debug("drawImage "+JSON.stringify([i, realStart - leftPointer, 0, end - realStart, canvasHeight, realStart - start, 0, end - realStart, canvasHeight]));

        ctx.drawImage(canvases[i], realStart - leftPointer, 0, end - realStart, canvasHeight, realStart - start, 0, end - realStart, canvasHeight);

      }
      leftPointer += canvasWidth;
      if (leftPointer >= fullWidth) {
        leftPointer = 0;
        nextRound = true;
      }
    }
    return $background;
  },
  cloneLinks: function ($source, start, end) {
    var $gantt_links_area = $source.find(".gantt_links_area");
    var $links = $gantt_links_area
        .clone()
        .addClass("gantt-print-links-area")
        .css('left', -start + 'px');
    $links.find(".gantt_task_link > div").filter(function () {
      var left = parseInt(this.style.left);
      var width = parseInt(this.style.width || 10);
      //ysy.log.debug("start: " + (left + width) + "<" + start +
      //    " end: " + left + ">" + end +
      //    "    filtered = " + (left > end || left + width < start));
      return (left > end || left + width < start);
    }).remove();
    return $links;
  },
  cloneTasks: function ($source, start, end) {
    var $gantt_bars_area = $source.find(".gantt_bars_area");
    var $tasks = $($gantt_bars_area[0].cloneNode(false))
        .addClass("gantt-print-bars-area")
        .css('left', -start + 'px');
    var taskArray = $gantt_bars_area.children();
    for (var i = 0; i < taskArray.length; i++) {
      var task = taskArray[i];
      var left = parseInt(task.style.left) - 50;
      var width = task.offsetWidth + 300;
      //ysy.log.debug("start: "+(left+task.offsetWidth)+"<"+start+" end: "+ left + ">"+ end);
      if (left > end || left + width < start) continue;
      $tasks.append($(task).clone());
    }
    var sourceCanvases = $gantt_bars_area.find("canvas");
    if (sourceCanvases.length > 0) {
      var clonedCanvases = $tasks.find("canvas");
      for (i = 0; i < clonedCanvases.length; i++) {
        clonedCanvases[i].getContext('2d').drawImage(sourceCanvases[i], 0, 0);
      }
    }
    return $tasks;
  }
};
